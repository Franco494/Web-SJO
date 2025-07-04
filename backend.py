# main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import jwt
import hashlib
from contextlib import contextmanager

# App configuration
app = FastAPI(title="Sistema Parroquial API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = "mssql+pyodbc://sa:123@localhost/dbPVParroquial?driver=ODBC+Driver+17+for+SQL+Server"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str

class PersonaBase(BaseModel):
    tipo_documento: str
    num_documento: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    nombres: str
    fecha_nacimiento: Optional[datetime] = None
    sexo: str
    correo: Optional[str] = None
    celular: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class ClienteCreate(PersonaBase):
    pass

class ServicioCreate(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    requiere_cita: str = '0'

class AgendadoCreate(BaseModel):
    id_servicio: int
    id_cliente: int
    fecha_hora: datetime
    observaciones: Optional[str] = None

class VentaProcess(BaseModel):
    id_cliente: int
    servicios: List[int]  # Lista de IDs de agendados
    id_metodopago: int
    monto_recibido: float

class EmpleadoCreate(PersonaBase):
    id_rol: int
    id_contrato: int
    id_turno: int
    salario: float
    username: str
    clave: str
    observaciones: Optional[str] = None

class ReporteVentasRequest(BaseModel):
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )

# Auth Endpoints
@app.post("/api/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        # Usar el SP de validación
        query = text("""
            EXEC sp_ValidarUsuario @username = :username, @clave = :clave
        """)
        
        result = db.execute(query, {
            "username": request.username, 
            "clave": request.password
        }).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=401, 
                detail="Credenciales inválidas"
            )
        
        user_data = {
            "id_usuario": result.id_usuario,
            "username": result.username,
            "nombre_completo": result.nombre_completo,
            "rol": result.rol
        }
        
        token = create_access_token(user_data)
        
        return {"token": token, "user": user_data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en login: {str(e)}")

# Dashboard Endpoints
@app.get("/api/dashboard/resumen")
async def get_dashboard_resumen(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("SELECT * FROM vw_DashboardResumen")
        result = db.execute(query).fetchone()
        
        return {
            "ventas_dia": result.ventas_hoy or 0,
            "total_ventas_dia": float(result.total_ventas_hoy or 0),
            "citas_dia": result.citas_hoy or 0,
            "citas_pendientes": result.citas_pendientes or 0,
            "clientes_nuevos_mes": result.clientes_nuevos_mes or 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/agendados/proximas")
async def get_proximas_citas(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            SELECT TOP 10 a.id_agendado, a.fecha_hora, s.nombre AS servicio, 
                   p.nombres + ' ' + p.apellido_paterno AS cliente,
                   CASE a.estado 
                       WHEN '1' THEN 'Separado'
                       WHEN '2' THEN 'Pagado'
                       WHEN '3' THEN 'Cancelado'
                   END AS estado
            FROM AGENDADOS a
            INNER JOIN SERVICIO s ON a.id_servicio = s.id_servicio
            INNER JOIN CLIENTE c ON a.id_cliente = c.id_cliente
            INNER JOIN PERSONA p ON c.id_persona = p.id_persona
            WHERE a.fecha_hora >= GETDATE()
                  AND a.estado = '1'
            ORDER BY a.fecha_hora
        """)
        
        results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Clientes Endpoints
@app.get("/api/clientes")
async def get_clientes(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("EXEC sp_ObtenerClientes")
        results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/clientes")
async def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            DECLARE @id_cliente INT;
            EXEC sp_RegistrarCliente 
                @nombre = :nombres,
                @apellido_paterno = :apellido_paterno,
                @apellido_materno = :apellido_materno,
                @tipo_documento = :tipo_documento,
                @numero_documento = :num_documento,
                @genero = :sexo,
                @fecha_nacimiento = :fecha_nacimiento,
                @telefono = :celular,
                @email = :correo,
                @direccion = :direccion,
                @id_cliente = @id_cliente OUTPUT;
            SELECT @id_cliente AS id_cliente;
        """)
        
        result = db.execute(query, cliente.dict()).fetchone()
        db.commit()
        
        return {
            "id_cliente": result.id_cliente, 
            "message": "Cliente registrado exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Servicios Endpoints
@app.get("/api/servicios")
async def get_servicios(
    requiere_cita: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        if requiere_cita:
            query = text("EXEC sp_ObtenerServicios @requiere_cita = :requiere_cita")
            results = db.execute(query, {"requiere_cita": requiere_cita}).fetchall()
        else:
            query = text("EXEC sp_ObtenerServicios")
            results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/servicios")
async def create_servicio(
    servicio: ServicioCreate,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            DECLARE @id_servicio INT;
            EXEC sp_RegistrarServicio 
                @id_categoria = :id_categoria,
                @nombre = :nombre,
                @descripcion = :descripcion,
                @precio = :precio,
                @requiere_cita = :requiere_cita,
                @id_servicio = @id_servicio OUTPUT;
            SELECT @id_servicio AS id_servicio;
        """)
        
        result = db.execute(query, servicio.dict()).fetchone()
        db.commit()
        
        return {
            "id_servicio": result.id_servicio, 
            "message": "Servicio registrado exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Agendados Endpoints
@app.get("/api/agendados")
async def get_agendados(
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        if fecha:
            query = text("EXEC sp_ObtenerAgendados @fecha_inicio = :fecha")
            results = db.execute(query, {"fecha": fecha}).fetchall()
        else:
            query = text("EXEC sp_ObtenerAgendados")
            results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/agendados")
async def create_agendado(
    agendado: AgendadoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            DECLARE @id_agendado INT;
            EXEC sp_AgendarServicio
                @id_servicio = :id_servicio,
                @id_cliente = :id_cliente,
                @id_usuario = :id_usuario,
                @fecha_hora = :fecha_hora,
                @observaciones = :observaciones,
                @id_agendado = @id_agendado OUTPUT;
            SELECT @id_agendado AS id_agendado;
        """)
        
        params = agendado.dict()
        params['id_usuario'] = current_user['id_usuario']
        
        result = db.execute(query, params).fetchone()
        db.commit()
        
        return {
            "id_agendado": result.id_agendado,
            "message": "Servicio agendado exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Ventas Endpoints
@app.get("/api/clientes/{id_cliente}/servicios-pendientes")
async def get_servicios_pendientes(
    id_cliente: int,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("EXEC sp_ObtenerServiciosPendientesPorCliente @id_cliente = :id_cliente")
        results = db.execute(query, {"id_cliente": id_cliente}).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/ventas")
async def procesar_venta(
    venta: VentaProcess,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        # Convertir lista de IDs a string separado por comas
        agendados_ids = ','.join(map(str, venta.servicios))
        
        query = text("""
            DECLARE @id_venta INT, @id_comprobante INT;
            EXEC sp_ProcesarVenta
                @id_cliente = :id_cliente,
                @agendados_ids = :agendados_ids,
                @id_metodopago = :id_metodopago,
                @id_usuario = :id_usuario,
                @monto_recibido = :monto_recibido,
                @id_venta = @id_venta OUTPUT,
                @id_comprobante = @id_comprobante OUTPUT;
            SELECT @id_venta AS id_venta, @id_comprobante AS id_comprobante;
        """)
        
        result = db.execute(query, {
            "id_cliente": venta.id_cliente,
            "agendados_ids": agendados_ids,
            "id_metodopago": venta.id_metodopago,
            "id_usuario": current_user['id_usuario'],
            "monto_recibido": venta.monto_recibido
        }).fetchone()
        
        db.commit()
        
        # Obtener detalles del comprobante
        comp_query = text("""
            SELECT tipo_comprobante + '-' + serie + '-' + numero AS comprobante
            FROM COMPROBANTE WHERE id_comprobante = :id_comprobante
        """)
        comp_result = db.execute(comp_query, {"id_comprobante": result.id_comprobante}).fetchone()
        
        return {
            "id_venta": result.id_venta,
            "id_comprobante": result.id_comprobante,
            "numero_comprobante": comp_result.comprobante,
            "message": "Venta procesada exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

@app.get("/api/ventas/hoy")
async def get_ventas_hoy(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("EXEC sp_ObtenerVentasDelDia")
        results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Empleados Endpoints
@app.get("/api/empleados")
async def get_empleados(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("EXEC sp_ObtenerEmpleados")
        results = db.execute(query).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/empleados")
async def create_empleado(
    empleado: EmpleadoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            DECLARE @id_empleado INT;
            EXEC sp_RegistrarEmpleadoCompleto
                @nombres = :nombres,
                @apellido_paterno = :apellido_paterno,
                @apellido_materno = :apellido_materno,
                @tipo_documento = :tipo_documento,
                @num_documento = :num_documento,
                @sexo = :sexo,
                @fecha_nacimiento = :fecha_nacimiento,
                @celular = :celular,
                @correo = :correo,
                @direccion = :direccion,
                @id_rol = :id_rol,
                @id_contrato = :id_contrato,
                @id_turno = :id_turno,
                @salario = :salario,
                @observaciones = :observaciones,
                @username = :username,
                @clave = :clave,
                @id_empleado = @id_empleado OUTPUT;
            SELECT @id_empleado AS id_empleado;
        """)
        
        result = db.execute(query, empleado.dict()).fetchone()
        db.commit()
        
        return {
            "id_empleado": result.id_empleado,
            "message": "Empleado registrado exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Reportes Endpoints
@app.post("/api/reportes/ventas")
async def reporte_ventas(
    request: ReporteVentasRequest,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            EXEC sp_ReporteVentasPorPeriodo 
                @fecha_inicio = :fecha_inicio,
                @fecha_fin = :fecha_fin
        """)
        
        results = db.execute(query, {
            "fecha_inicio": request.fecha_inicio.date(),
            "fecha_fin": request.fecha_fin.date() if request.fecha_fin else datetime.now().date()
        }).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/reportes/servicios-mas-solicitados")
async def reporte_servicios_mas_solicitados(
    fecha_inicio: str,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    try:
        query = text("""
            EXEC sp_ReporteServiciosMasSolicitados 
                @fecha_inicio = :fecha_inicio,
                @fecha_fin = :fecha_fin
        """)
        
        results = db.execute(query, {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin or datetime.now().date()
        }).fetchall()
        
        return [dict(row._mapping) for row in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Endpoints auxiliares
@app.get("/api/categorias")
async def get_categorias(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    query = text("""
        SELECT id_categoria, nombre, descripcion
        FROM CATEGORIA
        WHERE estado = '1'
        ORDER BY nombre
    """)
    
    results = db.execute(query).fetchall()
    
    return [dict(row._mapping) for row in results]

@app.get("/api/metodos-pago")
async def get_metodos_pago(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    query = text("""
        SELECT id_metodopago, tipo, descripcion
        FROM METODO_PAGO
        WHERE estado = '1'
        ORDER BY tipo
    """)
    
    results = db.execute(query).fetchall()
    
    return [dict(row._mapping) for row in results]

@app.get("/api/roles")
async def get_roles(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    query = text("""
        SELECT id_rol, nomrol, descripcion
        FROM ROL
        WHERE estado = '1'
        ORDER BY nomrol
    """)
    
    results = db.execute(query).fetchall()
    
    return [dict(row._mapping) for row in results]

@app.get("/api/contratos")
async def get_contratos(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    query = text("""
        SELECT id_contrato, nombre_contrato, descripcion
        FROM CONTRATO
        WHERE estado = '1'
        ORDER BY nombre_contrato
    """)
    
    results = db.execute(query).fetchall()
    
    return [dict(row._mapping) for row in results]

@app.get("/api/turnos")
async def get_turnos(
    db: Session = Depends(get_db),
    current_user = Depends(verify_token)
):
    query = text("""
        SELECT id_turno, nombre_turno, hora_inicio, hora_fin, dias_semana
        FROM TURNO
        WHERE estado = '1'
        ORDER BY nombre_turno
    """)
    
    results = db.execute(query).fetchall()
    
    return [dict(row._mapping) for row in results]

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)