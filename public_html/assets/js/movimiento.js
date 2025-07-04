// API Configuration
const API_URL = 'http://localhost:8000/api';
let currentUser = null;
let authToken = null;

// Utility Functions
const api = async (endpoint, options = {}) => {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json', 
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
};

const showSection = (sectionId) => {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Update section title
    const titles = {
        dashboardSection: 'Dashboard',
        clientesSection: 'Clientes',
        serviciosSection: 'Servicios',
        agendadosSection: 'Servicios Agendados',
        ventasSection: 'Ventas',
        empleadosSection: 'Empleados',
        reportesSection: 'Reportes'
    };
    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Dashboard';
};

const showModal = (modalId) => {
    document.getElementById(modalId).style.display = 'block';
    
    // Cargar datos necesarios según el modal
    if (modalId === 'servicioModal') {
        loadCategoriasForModal();
    } else if (modalId === 'agendarModal') {
        console.log('Abriendo modal de agendar...');
        loadClientesForModal();
        loadServiciosForModal();
    } else if (modalId === 'empleadoModal') {
        loadRolesForModal();
        loadContratosForModal();
        loadTurnosForModal();
    }
};

const closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
    // Limpiar formulario
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
};

const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-PE', options);
};

const formatCurrency = (amount) => {
    return `S/. ${parseFloat(amount).toFixed(2)}`;
};

// Authentication con validaciones
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    let isValid = true;
    
    // Validar usuario
    if (!validateRequired(username.value)) {
        showError(username, 'El usuario es requerido');
        isValid = false;
    } else {
        clearError(username);
    }
    
    // Validar contraseña
    if (!validateRequired(password.value)) {
        showError(password, 'La contraseña es requerida');
        isValid = false;
    } else {
        clearError(password);
    }
    
    if (!isValid) {
        return;
    }
    
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ 
                username: username.value, 
                password: password.value 
            })
        });
        
        if (data.token) {
            authToken = data.token;
            currentUser = data.user;
            
            // Guardar en localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            document.getElementById('userDisplay').textContent = currentUser.nombre_completo;
            showPage('dashboardPage');
            loadDashboard();
        }
    } catch (error) {
        showError(password, 'Usuario o contraseña incorrectos');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('¿Desea cerrar sesión?')) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        showPage('loginPage');
    }
});

// Navigation
document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show section
        showSection(section + 'Section');
        
        // Load section data
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'clientes':
                loadClientes();
                break;
            case 'servicios':
                loadServicios();
                break;
            case 'agendados':
                loadAgendados();
                break;
            case 'ventas':
                loadVentas();
                break;
            case 'empleados':
                loadEmpleados();
                break;
            case 'reportes':
                loadReportes();
                break;
        }
    });
});

// Dashboard Functions
async function loadDashboard() {
    try {
        const dashboard = await api('/dashboard/resumen');
        
        document.getElementById('citasHoy').textContent = dashboard.citas_dia || 0;
        document.getElementById('ventasHoy').textContent = formatCurrency(dashboard.total_ventas_dia || 0);
        document.getElementById('pendientes').textContent = dashboard.citas_pendientes || 0;
        document.getElementById('clientesNuevos').textContent = dashboard.clientes_nuevos_mes || 0;
        
        // Load próximas citas
        const citas = await api('/agendados/proximas');
        
        const tbody = document.getElementById('proximasCitasTable');
        tbody.innerHTML = '';
        
        if (citas && citas.length > 0) {
            citas.forEach(cita => {
                tbody.innerHTML += `
                    <tr>
                        <td>${formatDate(cita.fecha_hora)}</td>
                        <td>${cita.cliente}</td>
                        <td>${cita.servicio}</td>
                        <td><span class="badge badge-${cita.estado.toLowerCase()}">${cita.estado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="procesarCita(${cita.id_agendado})">
                                <i class="fas fa-check"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay citas próximas</td></tr>';
        }
    } catch (error) {
        alert('Error al cargar el dashboard: ' + error.message);
    }
}

// Clientes Functions
async function loadClientes() {
    try {
        const clientes = await api('/clientes');
        
        const tbody = document.getElementById('clientesTable');
        tbody.innerHTML = '';
        
        if (clientes && clientes.length > 0) {
            clientes.forEach(cliente => {
                tbody.innerHTML += `
                    <tr>
                        <td>${cliente.codigo_cliente || 'N/A'}</td>
                        <td>${cliente.nombres} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}</td>
                        <td>${cliente.num_documento}</td>
                        <td>${cliente.celular}</td>
                        <td>${cliente.correo || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="verHistorialCliente(${cliente.id_cliente})">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="editCliente(${cliente.id_cliente})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes registrados</td></tr>';
        }
    } catch (error) {
        alert('Error al cargar clientes: ' + error.message);
    }
}

// Validation Functions
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validateDNI = (dni) => {
    return /^[0-9]{8}$/.test(dni);
};

const validateCE = (ce) => {
    return /^[A-Z0-9]{9,12}$/.test(ce);
};

const validatePhone = (phone) => {
    return /^[0-9]{9}$/.test(phone);
};

const validateRequired = (value) => {
    return value && value.trim() !== '';
};

const validatePrice = (price) => {
    return !isNaN(price) && parseFloat(price) > 0;
};

const validateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age >= 18;
};

const showError = (inputElement, message) => {
    // Remover error previo si existe
    const existingError = inputElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Agregar clase de error al input
    inputElement.classList.add('is-invalid');
    
    // Crear y mostrar mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-danger small mt-1';
    errorDiv.textContent = message;
    inputElement.parentElement.appendChild(errorDiv);
};

const clearError = (inputElement) => {
    inputElement.classList.remove('is-invalid');
    const errorDiv = inputElement.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
};

const validateForm = (formElement) => {
    let isValid = true;
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        clearError(input);
    });
    
    return isValid;
};

// Cliente Form con validaciones
document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    let isValid = true;
    
    // Validar nombres
    const nombres = form.nombres;
    if (!validateRequired(nombres.value)) {
        showError(nombres, 'Los nombres son requeridos');
        isValid = false;
    } else if (nombres.value.length < 2) {
        showError(nombres, 'Los nombres deben tener al menos 2 caracteres');
        isValid = false;
    } else {
        clearError(nombres);
    }
    
    // Validar apellido paterno
    const apellidoPaterno = form.apellido_paterno;
    if (!validateRequired(apellidoPaterno.value)) {
        showError(apellidoPaterno, 'El apellido paterno es requerido');
        isValid = false;
    } else if (apellidoPaterno.value.length < 2) {
        showError(apellidoPaterno, 'El apellido debe tener al menos 2 caracteres');
        isValid = false;
    } else {
        clearError(apellidoPaterno);
    }
    
    // Validar documento
    const tipoDoc = form.tipo_documento.value;
    const numDoc = form.num_documento;
    
    if (!validateRequired(numDoc.value)) {
        showError(numDoc, 'El número de documento es requerido');
        isValid = false;
    } else if (tipoDoc === 'DNI' && !validateDNI(numDoc.value)) {
        showError(numDoc, 'El DNI debe tener 8 dígitos');
        isValid = false;
    } else if (tipoDoc === 'CE' && !validateCE(numDoc.value)) {
        showError(numDoc, 'El CE debe tener entre 9 y 12 caracteres alfanuméricos');
        isValid = false;
    } else {
        clearError(numDoc);
    }
    
    // Validar celular
    const celular = form.celular;
    if (!validateRequired(celular.value)) {
        showError(celular, 'El celular es requerido');
        isValid = false;
    } else if (!validatePhone(celular.value)) {
        showError(celular, 'El celular debe tener 9 dígitos');
        isValid = false;
    } else {
        clearError(celular);
    }
    
    // Validar email (opcional pero si se ingresa debe ser válido)
    const correo = form.correo;
    if (correo.value && !validateEmail(correo.value)) {
        showError(correo, 'El correo electrónico no es válido');
        isValid = false;
    } else {
        clearError(correo);
    }
    
    // Validar fecha de nacimiento (opcional pero debe ser mayor de edad)
    const fechaNac = form.fecha_nacimiento;
    if (fechaNac.value && !validateAge(fechaNac.value)) {
        showError(fechaNac, 'El cliente debe ser mayor de 18 años');
        isValid = false;
    } else {
        clearError(fechaNac);
    }
    
    if (!isValid) {
        return;
    }
    
    // Si todas las validaciones pasan, enviar el formulario
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const result = await api('/clientes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        closeModal('clienteModal');
        loadClientes();
        alert('Cliente registrado correctamente');
    } catch (error) {
        alert('Error al registrar cliente: ' + error.message);
    }
});

// Servicios Functions
async function loadServicios() {
    try {
        const servicios = await api('/servicios');
        
        const container = document.getElementById('servicesContainer');
        container.innerHTML = '';
        
        if (servicios && servicios.length > 0) {
            servicios.forEach(servicio => {
                container.innerHTML += `
                    <div class="service-card">
                        <div class="service-header">
                            <span class="service-category">${servicio.categoria}</span>
                            <span class="service-price">${formatCurrency(servicio.precio)}</span>
                        </div>
                        <h3>${servicio.nombre}</h3>
                        <p>${servicio.descripcion || 'Sin descripción'}</p>
                        ${servicio.requiere_cita === '1' ? '<p><i class="fas fa-calendar-check"></i> Requiere cita</p>' : ''}
                        <div class="service-actions">
                            <button class="btn btn-sm btn-primary" onclick="editServicio(${servicio.id_servicio})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p class="text-center">No hay servicios registrados</p>';
        }
    } catch (error) {
        alert('Error al cargar servicios: ' + error.message);
    }
}

// Servicio Form con validaciones
document.getElementById('servicioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    let isValid = true;
    
    // Validar categoría
    const categoria = form.id_categoria;
    if (!validateRequired(categoria.value)) {
        showError(categoria, 'Debe seleccionar una categoría');
        isValid = false;
    } else {
        clearError(categoria);
    }
    
    // Validar nombre
    const nombre = form.nombre;
    if (!validateRequired(nombre.value)) {
        showError(nombre, 'El nombre del servicio es requerido');
        isValid = false;
    } else if (nombre.value.length < 3) {
        showError(nombre, 'El nombre debe tener al menos 3 caracteres');
        isValid = false;
    } else {
        clearError(nombre);
    }
    
    // Validar precio
    const precio = form.precio;
    if (!validateRequired(precio.value)) {
        showError(precio, 'El precio es requerido');
        isValid = false;
    } else if (!validatePrice(precio.value)) {
        showError(precio, 'El precio debe ser mayor a 0');
        isValid = false;
    } else if (parseFloat(precio.value) > 9999.99) {
        showError(precio, 'El precio no puede exceder S/. 9,999.99');
        isValid = false;
    } else {
        clearError(precio);
    }
    
    if (!isValid) {
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Convertir checkbox a '1' o '0'
    data.requiere_cita = data.requiere_cita ? '1' : '0';
    
    try {
        const result = await api('/servicios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        closeModal('servicioModal');
        loadServicios();
        alert('Servicio registrado correctamente');
    } catch (error) {
        alert('Error al registrar servicio: ' + error.message);
    }
});

// Agendados Functions
async function loadAgendados() {
    try {
        const filtroFecha = document.getElementById('filtroFecha').value;
        const agendados = await api(`/agendados${filtroFecha ? '?fecha=' + filtroFecha : ''}`);
        
        const tbody = document.getElementById('agendadosTable');
        tbody.innerHTML = '';
        
        if (agendados && agendados.length > 0) {
            agendados.forEach(agendado => {
                const estadoClass = agendado.estado === '1' ? 'warning' : 
                                   agendado.estado === '2' ? 'success' : 'danger';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${formatDate(agendado.fecha_hora)}</td>
                        <td>${agendado.cliente}</td>
                        <td>${agendado.servicio}</td>
                        <td>${agendado.observaciones || '-'}</td>
                        <td><span class="badge badge-${estadoClass}">${agendado.estado_desc}</span></td>
                        <td>
                            ${agendado.estado === '1' ? `
                                <button class="btn btn-sm btn-success" onclick="marcarComoPagado(${agendado.id_agendado})">
                                    <i class="fas fa-check"></i> Pagar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="cancelarAgendado(${agendado.id_agendado})">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay servicios agendados</td></tr>';
        }
    } catch (error) {
        alert('Error al cargar agendados: ' + error.message);
    }
}

// Filtro de fecha para agendados
document.getElementById('filtroFecha').addEventListener('change', loadAgendados);

// Agendar Form con validaciones
document.getElementById('agendarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    let isValid = true;
    
    // Validar cliente
    const cliente = form.id_cliente;
    if (!validateRequired(cliente.value)) {
        showError(cliente, 'Debe seleccionar un cliente');
        isValid = false;
    } else {
        clearError(cliente);
    }
    
    // Validar servicio
    const servicio = form.id_servicio;
    if (!validateRequired(servicio.value)) {
        showError(servicio, 'Debe seleccionar un servicio');
        isValid = false;
    } else {
        clearError(servicio);
    }
    
    // Validar fecha y hora
    const fechaHora = form.fecha_hora;
    if (!validateRequired(fechaHora.value)) {
        showError(fechaHora, 'La fecha y hora son requeridas');
        isValid = false;
    } else {
        const selectedDate = new Date(fechaHora.value);
        const now = new Date();
        
        if (selectedDate <= now) {
            showError(fechaHora, 'La fecha y hora deben ser futuras');
            isValid = false;
        } else {
            // Validar horario de atención (8:00 AM - 8:00 PM)
            const hour = selectedDate.getHours();
            if (hour < 8 || hour >= 20) {
                showError(fechaHora, 'El horario debe estar entre 8:00 AM y 8:00 PM');
                isValid = false;
            } else {
                clearError(fechaHora);
            }
        }
    }
    
    if (!isValid) {
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const result = await api('/agendados', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        closeModal('agendarModal');
        loadAgendados();
        alert('Servicio agendado correctamente');
    } catch (error) {
        alert('Error al agendar servicio: ' + error.message);
    }
});

// Ventas Functions
async function loadVentas() {
    try {
        // Cargar clientes en el select
        const clientes = await api('/clientes');
        const selectCliente = document.getElementById('ventaCliente');
        selectCliente.innerHTML = '<option value="">Seleccione cliente</option>';
        
        clientes.forEach(cliente => {
            selectCliente.innerHTML += `
                <option value="${cliente.id_cliente}">
                    ${cliente.nombres} ${cliente.apellido_paterno} - ${cliente.num_documento}
                </option>
            `;
        });
        
        // Cargar métodos de pago
        const metodosPago = await api('/metodos-pago');
        const selectMetodo = document.getElementById('metodoPago');
        selectMetodo.innerHTML = '<option value="">Seleccione método</option>';
        
        metodosPago.forEach(metodo => {
            selectMetodo.innerHTML += `
                <option value="${metodo.id_metodopago}">${metodo.tipo}</option>
            `;
        });
        
        // Cargar ventas del día
        loadVentasHoy();
    } catch (error) {
        alert('Error al cargar datos de ventas: ' + error.message);
    }
}

async function loadVentasHoy() {
    try {
        const ventas = await api('/ventas/hoy');
        
        const tbody = document.getElementById('ventasHoyTable');
        tbody.innerHTML = '';
        
        if (ventas && ventas.length > 0) {
            ventas.forEach(venta => {
                tbody.innerHTML += `
                    <tr>
                        <td>${new Date(venta.fecha_venta).toLocaleTimeString('es-PE')}</td>
                        <td>${venta.cliente}</td>
                        <td>${formatCurrency(venta.total_pagar)}</td>
                        <td>${venta.metodo_pago}</td>
                        <td>
                            <a href="#" onclick="imprimirComprobante('${venta.comprobante}')">
                                ${venta.comprobante}
                            </a>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay ventas registradas hoy</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar ventas del día:', error);
    }
}

// Selección de cliente para venta
document.getElementById('ventaCliente').addEventListener('change', async (e) => {
    const idCliente = e.target.value;
    
    if (!idCliente) {
        document.getElementById('serviciosPendientes').innerHTML = '';
        document.getElementById('totalPagar').value = '';
        return;
    }
    
    try {
        const servicios = await api(`/clientes/${idCliente}/servicios-pendientes`);
        
        const container = document.getElementById('serviciosPendientes');
        container.innerHTML = '';
        
        let total = 0;
        
        if (servicios && servicios.length > 0) {
            servicios.forEach(servicio => {
                container.innerHTML += `
                    <div class="form-check">
                        <input class="form-check-input servicio-checkbox" type="checkbox" 
                               value="${servicio.id_agendado}" data-precio="${servicio.precio}" 
                               id="servicio_${servicio.id_agendado}">
                        <label class="form-check-label" for="servicio_${servicio.id_agendado}">
                            ${servicio.servicio} - ${formatDate(servicio.fecha_hora)} - ${formatCurrency(servicio.precio)}
                        </label>
                    </div>
                `;
            });
            
            // Agregar event listeners a los checkboxes
            document.querySelectorAll('.servicio-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', calcularTotal);
            });
        } else {
            container.innerHTML = '<p class="text-muted">No hay servicios pendientes de pago</p>';
        }
        
        calcularTotal();
    } catch (error) {
        alert('Error al cargar servicios pendientes: ' + error.message);
    }
});

// Calcular total
function calcularTotal() {
    let total = 0;
    document.querySelectorAll('.servicio-checkbox:checked').forEach(checkbox => {
        total += parseFloat(checkbox.dataset.precio);
    });
    
    document.getElementById('totalPagar').value = formatCurrency(total);
    calcularVuelto();
}

// Calcular vuelto
document.getElementById('montoRecibido').addEventListener('input', calcularVuelto);

function calcularVuelto() {
    const totalText = document.getElementById('totalPagar').value;
    const total = parseFloat(totalText.replace('S/. ', '') || 0);
    const recibido = parseFloat(document.getElementById('montoRecibido').value || 0);
    const vuelto = recibido - total;
    
    document.getElementById('vuelto').value = formatCurrency(Math.max(0, vuelto));
}

// Procesar venta con validaciones
document.getElementById('ventaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    let isValid = true;
    
    // Validar cliente
    const cliente = document.getElementById('ventaCliente');
    if (!validateRequired(cliente.value)) {
        showError(cliente, 'Debe seleccionar un cliente');
        isValid = false;
    } else {
        clearError(cliente);
    }
    
    // Validar servicios seleccionados
    const serviciosSeleccionados = document.querySelectorAll('.servicio-checkbox:checked');
    if (serviciosSeleccionados.length === 0) {
        alert('Debe seleccionar al menos un servicio');
        isValid = false;
    }
    
    // Validar método de pago
    const metodoPago = document.getElementById('metodoPago');
    if (!validateRequired(metodoPago.value)) {
        showError(metodoPago, 'Debe seleccionar un método de pago');
        isValid = false;
    } else {
        clearError(metodoPago);
    }
    
    // Validar monto recibido
    const montoRecibido = document.getElementById('montoRecibido');
    const totalText = document.getElementById('totalPagar').value;
    const total = parseFloat(totalText.replace('S/. ', '') || 0);
    
    if (!validateRequired(montoRecibido.value)) {
        showError(montoRecibido, 'El monto recibido es requerido');
        isValid = false;
    } else if (parseFloat(montoRecibido.value) < total) {
        showError(montoRecibido, 'El monto recibido es insuficiente');
        isValid = false;
    } else {
        clearError(montoRecibido);
    }
    
    if (!isValid) {
        return;
    }
    
    const servicios = [];
    serviciosSeleccionados.forEach(checkbox => {
        servicios.push(parseInt(checkbox.value));
    });
    
    const data = {
        id_cliente: parseInt(cliente.value),
        servicios: servicios,
        id_metodopago: parseInt(metodoPago.value),
        monto_recibido: parseFloat(montoRecibido.value)
    };
    
    try {
        const result = await api('/ventas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        alert(`Venta procesada exitosamente\nComprobante: ${result.numero_comprobante}`);
        
        // Limpiar formulario
        form.reset();
        document.getElementById('serviciosPendientes').innerHTML = '';
        
        // Recargar ventas del día
        loadVentasHoy();
    } catch (error) {
        alert('Error al procesar venta: ' + error.message);
    }
});

// Empleados Functions
async function loadEmpleados() {
    try {
        const empleados = await api('/empleados');
        
        const tbody = document.getElementById('empleadosTable');
        tbody.innerHTML = '';
        
        if (empleados && empleados.length > 0) {
            empleados.forEach(empleado => {
                tbody.innerHTML += `
                    <tr>
                        <td>${empleado.codigo_empleado}</td>
                        <td>${empleado.nombres} ${empleado.apellido_paterno}</td>
                        <td>${empleado.rol}</td>
                        <td>${empleado.turno}</td>
                        <td>${formatCurrency(empleado.salario)}</td>
                        <td><span class="badge badge-${empleado.estado === '1' ? 'success' : 'danger'}">${empleado.estado_desc}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editEmpleado(${empleado.id_empleado})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${empleado.estado === '1' ? `
                                <button class="btn btn-sm btn-danger" onclick="desactivarEmpleado(${empleado.id_empleado})">
                                    <i class="fas fa-ban"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay empleados registrados</td></tr>';
        }
    } catch (error) {
        alert('Error al cargar empleados: ' + error.message);
    }
}

// Empleado Form con validaciones completas
document.getElementById('empleadoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    let isValid = true;
    
    // Validar nombres
    const nombres = form.nombres;
    if (!validateRequired(nombres.value)) {
        showError(nombres, 'Los nombres son requeridos');
        isValid = false;
    } else if (nombres.value.length < 2) {
        showError(nombres, 'Los nombres deben tener al menos 2 caracteres');
        isValid = false;
    } else {
        clearError(nombres);
    }
    
    // Validar apellido paterno
    const apellidoPaterno = form.apellido_paterno;
    if (!validateRequired(apellidoPaterno.value)) {
        showError(apellidoPaterno, 'El apellido paterno es requerido');
        isValid = false;
    } else {
        clearError(apellidoPaterno);
    }
    
    // Validar documento
    const tipoDoc = form.tipo_documento.value;
    const numDoc = form.num_documento;
    
    if (!validateRequired(numDoc.value)) {
        showError(numDoc, 'El número de documento es requerido');
        isValid = false;
    } else if (tipoDoc === 'DNI' && !validateDNI(numDoc.value)) {
        showError(numDoc, 'El DNI debe tener 8 dígitos');
        isValid = false;
    } else {
        clearError(numDoc);
    }
    
    // Validar celular
    const celular = form.celular;
    if (!validateRequired(celular.value)) {
        showError(celular, 'El celular es requerido');
        isValid = false;
    } else if (!validatePhone(celular.value)) {
        showError(celular, 'El celular debe tener 9 dígitos');
        isValid = false;
    } else {
        clearError(celular);
    }
    
    // Validar email
    const correo = form.correo;
    if (correo.value && !validateEmail(correo.value)) {
        showError(correo, 'El correo electrónico no es válido');
        isValid = false;
    } else {
        clearError(correo);
    }
    
    // Validar fecha de nacimiento (debe ser mayor de edad)
    const fechaNac = form.fecha_nacimiento;
    if (fechaNac.value && !validateAge(fechaNac.value)) {
        showError(fechaNac, 'El empleado debe ser mayor de 18 años');
        isValid = false;
    } else {
        clearError(fechaNac);
    }
    
    // Validar rol
    const rol = form.id_rol;
    if (!validateRequired(rol.value)) {
        showError(rol, 'Debe seleccionar un rol');
        isValid = false;
    } else {
        clearError(rol);
    }
    
    // Validar contrato
    const contrato = form.id_contrato;
    if (!validateRequired(contrato.value)) {
        showError(contrato, 'Debe seleccionar un tipo de contrato');
        isValid = false;
    } else {
        clearError(contrato);
    }
    
    // Validar turno
    const turno = form.id_turno;
    if (!validateRequired(turno.value)) {
        showError(turno, 'Debe seleccionar un turno');
        isValid = false;
    } else {
        clearError(turno);
    }
    
    // Validar salario
    const salario = form.salario;
    if (!validateRequired(salario.value)) {
        showError(salario, 'El salario es requerido');
        isValid = false;
    } else if (!validatePrice(salario.value)) {
        showError(salario, 'El salario debe ser mayor a 0');
        isValid = false;
    } else if (parseFloat(salario.value) > 99999.99) {
        showError(salario, 'El salario no puede exceder S/. 99,999.99');
        isValid = false;
    } else {
        clearError(salario);
    }
    
    // Validar username
    const username = form.username;
    if (!validateRequired(username.value)) {
        showError(username, 'El nombre de usuario es requerido');
        isValid = false;
    } else if (username.value.length < 4) {
        showError(username, 'El usuario debe tener al menos 4 caracteres');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
        showError(username, 'El usuario solo puede contener letras, números y guión bajo');
        isValid = false;
    } else {
        clearError(username);
    }
    
    // Validar contraseña
    const clave = form.clave;
    if (!validateRequired(clave.value)) {
        showError(clave, 'La contraseña es requerida');
        isValid = false;
    } else if (clave.value.length < 6) {
        showError(clave, 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        clearError(clave);
    }
    
    if (!isValid) {
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const result = await api('/empleados', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        closeModal('empleadoModal');
        loadEmpleados();
        alert('Empleado registrado correctamente');
    } catch (error) {
        alert('Error al registrar empleado: ' + error.message);
    }
});

// Reportes Functions
async function loadReportes() {
    // Configurar fechas por defecto
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    document.getElementById('fechaInicioVentas').value = inicioMes.toISOString().split('T')[0];
    document.getElementById('fechaFinVentas').value = hoy.toISOString().split('T')[0];
    
    // Cargar gráfico de servicios más solicitados
    loadServiciosMasSolicitados();
}

async function loadServiciosMasSolicitados() {
    try {
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        
        const servicios = await api(`/reportes/servicios-mas-solicitados?fecha_inicio=${fechaInicio.toISOString().split('T')[0]}`);
        
        const ctx = document.getElementById('serviciosChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: servicios.map(s => s.servicio),
                datasets: [{
                    label: 'Cantidad Solicitada',
                    data: servicios.map(s => s.cantidad_solicitada),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Servicios Más Solicitados (Último Mes)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al cargar gráfico de servicios:', error);
    }
}

// Generar reporte de ventas con validaciones
document.getElementById('reporteVentasForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fechaInicio = document.getElementById('fechaInicioVentas');
    const fechaFin = document.getElementById('fechaFinVentas');
    let isValid = true;
    
    // Validar fecha inicio
    if (!validateRequired(fechaInicio.value)) {
        showError(fechaInicio, 'La fecha de inicio es requerida');
        isValid = false;
    } else {
        clearError(fechaInicio);
    }
    
    // Validar fecha fin
    if (!validateRequired(fechaFin.value)) {
        showError(fechaFin, 'La fecha de fin es requerida');
        isValid = false;
    } else if (new Date(fechaFin.value) < new Date(fechaInicio.value)) {
        showError(fechaFin, 'La fecha de fin debe ser posterior a la fecha de inicio');
        isValid = false;
    } else {
        clearError(fechaFin);
    }
    
    // Validar que el rango no exceda 1 año
    const inicio = new Date(fechaInicio.value);
    const fin = new Date(fechaFin.value);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
        showError(fechaFin, 'El rango de fechas no puede exceder 1 año');
        isValid = false;
    }
    
    if (!isValid) {
        return;
    }
    
    try {
        const reporte = await api('/reportes/ventas', {
            method: 'POST',
            body: JSON.stringify({
                fecha_inicio: fechaInicio.value,
                fecha_fin: fechaFin.value
            })
        });
        
        // Aquí podrías generar un PDF o mostrar los datos en una tabla
        console.log('Reporte de ventas:', reporte);
        
        // Por ahora, mostrar resumen
        let totalVentas = 0;
        let cantidadVentas = 0;
        
        reporte.forEach(dia => {
            totalVentas += dia.total_ventas;
            cantidadVentas += dia.cantidad_ventas;
        });
        
        alert(`Reporte de Ventas\n\nPeríodo: ${fechaInicio.value} al ${fechaFin.value}\nTotal de ventas: ${cantidadVentas}\nMonto total: ${formatCurrency(totalVentas)}`);
        
    } catch (error) {
        alert('Error al generar reporte: ' + error.message);
    }
});

// Modal Helper Functions
async function loadCategoriasForModal() {
    try {
        const categorias = await api('/categorias');
        const select = document.querySelector('#servicioForm select[name="id_categoria"]');
        select.innerHTML = '<option value="">Seleccione categoría</option>';
        
        categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function loadClientesForModal() {
    try {
        const clientes = await api('/clientes');
        const select = document.querySelector('#agendarForm select[name="id_cliente"]');
        select.innerHTML = '<option value="">Seleccione cliente</option>';
        
        clientes.forEach(cliente => {
            select.innerHTML += `
                <option value="${cliente.id_cliente}">
                    ${cliente.nombres} ${cliente.apellido_paterno} - ${cliente.num_documento}
                </option>
            `;
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

async function loadServiciosForModal() {
    try {
        // Cargar TODOS los servicios, no solo los que requieren cita
        const servicios = await api('/servicios');
        const select = document.querySelector('#agendarForm select[name="id_servicio"]');
        select.innerHTML = '<option value="">Seleccione servicio</option>';
        
        if (servicios && servicios.length > 0) {
            // Agrupar por categoría para mejor organización
            const serviciosPorCategoria = {};
            
            servicios.forEach(servicio => {
                if (!serviciosPorCategoria[servicio.categoria]) {
                    serviciosPorCategoria[servicio.categoria] = [];
                }
                serviciosPorCategoria[servicio.categoria].push(servicio);
            });
            
            // Crear optgroups por categoría
            Object.keys(serviciosPorCategoria).forEach(categoria => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = categoria;
                
                serviciosPorCategoria[categoria].forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.id_servicio;
                    option.textContent = `${servicio.nombre} - ${formatCurrency(servicio.precio)}`;
                    
                    // Marcar visualmente si requiere cita
                    if (servicio.requiere_cita === '1') {
                        option.textContent += ' (Requiere cita)';
                    }
                    
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        } else {
            select.innerHTML += '<option value="" disabled>No hay servicios disponibles</option>';
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
        const select = document.querySelector('#agendarForm select[name="id_servicio"]');
        select.innerHTML = '<option value="">Error al cargar servicios</option>';
    }
}

async function loadRolesForModal() {
    try {
        const roles = await api('/roles');
        const select = document.querySelector('#empleadoForm select[name="id_rol"]');
        select.innerHTML = '<option value="">Seleccione rol</option>';
        
        roles.forEach(rol => {
            select.innerHTML += `<option value="${rol.id_rol}">${rol.nomrol}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

async function loadContratosForModal() {
    try {
        const contratos = await api('/contratos');
        const select = document.querySelector('#empleadoForm select[name="id_contrato"]');
        select.innerHTML = '<option value="">Seleccione contrato</option>';
        
        contratos.forEach(contrato => {
            select.innerHTML += `<option value="${contrato.id_contrato}">${contrato.nombre_contrato}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar contratos:', error);
    }
}

async function loadTurnosForModal() {
    try {
        const turnos = await api('/turnos');
        const select = document.querySelector('#empleadoForm select[name="id_turno"]');
        select.innerHTML = '<option value="">Seleccione turno</option>';
        
        turnos.forEach(turno => {
            select.innerHTML += `<option value="${turno.id_turno}">${turno.nombre_turno}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar turnos:', error);
    }
}

// Action Functions
async function procesarCita(id) {
    if (!confirm('¿Desea marcar esta cita como completada?')) return;
    
    try {
        // Aquí iría la lógica para procesar la cita
        loadDashboard();
    } catch (error) {
        alert('Error al procesar cita: ' + error.message);
    }
}

async function verHistorialCliente(id) {
    // Mostrar historial del cliente
    alert('Función en desarrollo: Ver historial del cliente ' + id);
}

function editCliente(id) {
    alert('Función de edición en desarrollo');
}

function editServicio(id) {
    alert('Función de edición en desarrollo');
}

function editEmpleado(id) {
    alert('Función de edición en desarrollo');
}

async function marcarComoPagado(id) {
    alert('Para procesar pagos, use la sección de Ventas');
}

async function cancelarAgendado(id) {
    if (!confirm('¿Está seguro de cancelar este servicio agendado?')) return;
    
    // Aquí iría la lógica para cancelar
    alert('Función en desarrollo');
}

async function desactivarEmpleado(id) {
    if (!confirm('¿Está seguro de desactivar este empleado?')) return;
    
    // Aquí iría la lógica para desactivar
    alert('Función en desarrollo');
}

function imprimirComprobante(numero) {
    alert(`Imprimiendo comprobante: ${numero}`);
    // Aquí iría la lógica para imprimir
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Set current date for filters
    const today = new Date().toISOString().split('T')[0];
    const filtroFecha = document.getElementById('filtroFecha');
    if (filtroFecha) {
        filtroFecha.value = today;
    }
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // Check for saved session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        document.getElementById('userDisplay').textContent = currentUser.nombre_completo;
        showPage('dashboardPage');
        loadDashboard();
    }
});