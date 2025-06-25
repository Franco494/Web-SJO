// ===============================================
// SISTEMA DE GESTIÓN PARROQUIAL - JAVASCRIPT
// ===============================================

class ParroquiaSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.cart = [];
        this.currentDate = new Date();
        this.sidebarCollapsed = false;
        
        // Datos simulados
        this.data = {
            personas: [
                {
                    id: 1,
                    tipo_documento: 'DNI',
                    num_documento: '12345678',
                    nombres: 'Juan Carlos',
                    apellidos: 'Mendoza Santos',
                    correo: 'padre.juan@parroquia.pe',
                    celular: '987654321',
                    tipo: 'Empleado',
                    estado: 'Activo'
                },
                {
                    id: 2,
                    tipo_documento: 'DNI',
                    num_documento: '87654321',
                    nombres: 'María Elena',
                    apellidos: 'García López',
                    correo: 'maria.garcia@parroquia.pe',
                    celular: '987654322',
                    tipo: 'Empleado',
                    estado: 'Activo'
                },
                {
                    id: 3,
                    tipo_documento: 'DNI',
                    num_documento: '55667788',
                    nombres: 'Pedro José',
                    apellidos: 'López Vega',
                    correo: 'pedro.lopez@hotmail.com',
                    celular: '987654325',
                    tipo: 'Cliente',
                    estado: 'Activo'
                }
            ],
            servicios: [
                { id: 1, nombre: 'Matrimonio Particular', precio: 500.00, categoria: 'Sacramentos' },
                { id: 2, nombre: 'Bautismo Particular', precio: 150.00, categoria: 'Sacramentos' },
                { id: 3, nombre: 'Misa con Coro', precio: 200.00, categoria: 'Celebraciones' },
                { id: 4, nombre: 'Constancia de Matrimonio', precio: 30.00, categoria: 'Documentos' },
                { id: 5, nombre: 'Constancia de Bautismo', precio: 30.00, categoria: 'Documentos' }
            ],
            eventos: [
                {
                    id: 1,
                    fecha: '2025-06-25',
                    hora: '09:00',
                    tipo: 'Matrimonio',
                    cliente: 'Juan Pérez & María García',
                    estado: 'Confirmado'
                },
                {
                    id: 2,
                    fecha: '2025-06-25',
                    hora: '11:00',
                    tipo: 'Bautismo',
                    cliente: 'Familia Rodríguez',
                    estado: 'Confirmado'
                }
            ],
            ventas: [
                {
                    id: 1,
                    numero: 'VEN000001',
                    cliente: 'Pedro López',
                    total: 150.00,
                    metodo_pago: 'Efectivo',
                    hora: '10:30 AM'
                }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.renderDashboard();
        this.renderCalendar();
        this.loadPersonasTable();
        this.setupModals();
        this.setupTabs();
        this.setupSalesSystem();
    }

    // ===============================================
    // NAVEGACIÓN Y SIDEBAR
    // ===============================================

    setupEventListeners() {
        // Toggle sidebar
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Responsive sidebar
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.sidebarCollapsed = true;
                document.getElementById('sidebar').classList.add('collapsed');
                document.querySelector('.main-content').classList.add('expanded');
            }
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
                
                // Mobile: close sidebar after navigation
                if (window.innerWidth <= 768) {
                    this.hideSidebar();
                }
            });
        });
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
    }

    navigateToSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'personas':
                this.loadPersonasTable();
                break;
            case 'eventos':
                this.renderCalendar();
                break;
            case 'ventas':
                this.loadSalesHistory();
                break;
        }
    }

    // ===============================================
    // DASHBOARD
    // ===============================================

    renderDashboard() {
        // Simular datos del dashboard
        this.updateDashboardStats();
        this.renderIncomeChart();
    }

    updateDashboardStats() {
        const stats = {
            feligreses: 247,
            eventosHoy: 12,
            ingresosDia: 2450,
            sacramentosPendientes: 8
        };

        // Animación de contadores
        this.animateCounter('.card:nth-child(1) h3', stats.feligreses);
        this.animateCounter('.card:nth-child(2) h3', stats.eventosHoy);
        this.animateCounter('.card:nth-child(4) h3', stats.sacramentosPendientes);
        
        // Formato de moneda para ingresos
        const ingresoElement = document.querySelector('.card:nth-child(3) h3');
        if (ingresoElement) {
            this.animateCounter(ingresoElement, stats.ingresosDia, true);
        }
    }

    animateCounter(selector, target, isCurrency = false) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!element) return;

        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (isCurrency) {
                element.textContent = `S/ ${Math.floor(current).toLocaleString()}`;
            } else {
                element.textContent = Math.floor(current);
            }
        }, 20);
    }

    renderIncomeChart() {
        const canvas = document.getElementById('ingresoChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = [1200, 1800, 2200, 1900, 2450, 2100, 2800];
        const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Configurar estilos
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        const maxValue = Math.max(...data);
        
        // Dibujar líneas de la cuadrícula
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
        
        // Dibujar la línea del gráfico
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Dibujar puntos
        ctx.fillStyle = '#2563eb';
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Dibujar etiquetas
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        labels.forEach((label, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            ctx.fillText(label, x, canvas.height - 10);
        });
    }

    // ===============================================
    // GESTIÓN DE PERSONAS
    // ===============================================

    loadPersonasTable() {
        const tbody = document.getElementById('personasTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.data.personas.forEach(persona => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${persona.num_documento}</td>
                <td>${persona.nombres}</td>
                <td>${persona.apellidos}</td>
                <td>${persona.correo}</td>
                <td>${persona.celular}</td>
                <td><span class="badge ${persona.tipo === 'Empleado' ? 'badge-info' : 'badge-success'}">${persona.tipo}</span></td>
                <td><span class="badge badge-success">${persona.estado}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="sistema.editPersona(${persona.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="sistema.deletePersona(${persona.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editPersona(id) {
        const persona = this.data.personas.find(p => p.id === id);
        if (persona) {
            // Aquí se abriría el modal con los datos de la persona
            this.openModal('personaModal');
            console.log('Editando persona:', persona);
        }
    }

    deletePersona(id) {
        if (confirm('¿Está seguro de que desea eliminar esta persona?')) {
            this.data.personas = this.data.personas.filter(p => p.id !== id);
            this.loadPersonasTable();
            this.showNotification('Persona eliminada correctamente', 'success');
        }
    }

    // ===============================================
    // GESTIÓN DE EVENTOS Y CALENDARIO
    // ===============================================

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Actualizar título del mes
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        }

        // Limpiar calendario
        calendar.innerHTML = '';
        
        // Días de la semana
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-header';
            dayElement.textContent = day;
            dayElement.style.cssText = `
                background-color: var(--bg-secondary);
                padding: var(--spacing-sm);
                font-weight: 600;
                text-align: center;
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
            `;
            calendar.appendChild(dayElement);
        });

        // Calcular primer día del mes y días en el mes
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Días del mes anterior
        const prevMonth = new Date(year, month - 1, 1);
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createCalendarDay(day, true);
            calendar.appendChild(dayElement);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getFullYear() === year && 
                           today.getMonth() === month && 
                           today.getDate() === day;
            
            const hasEvents = this.data.eventos.some(evento => {
                const eventoDate = new Date(evento.fecha);
                return eventoDate.getFullYear() === year &&
                       eventoDate.getMonth() === month &&
                       eventoDate.getDate() === day;
            });

            const dayElement = this.createCalendarDay(day, false, isToday, hasEvents);
            calendar.appendChild(dayElement);
        }

        // Días del mes siguiente para completar la grilla
        const totalCells = calendar.children.length;
        const remainingCells = 42 - totalCells; // 6 semanas × 7 días
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createCalendarDay(day, true);
            calendar.appendChild(dayElement);
        }

        // Configurar navegación del calendario
        this.setupCalendarNavigation();
    }

    createCalendarDay(day, isOtherMonth = false, isToday = false, hasEvents = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        if (hasEvents) {
            dayElement.classList.add('has-events');
        }

        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                this.selectCalendarDay(day);
            }
        });

        return dayElement;
    }

    setupCalendarNavigation() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            };
        }
    }

    selectCalendarDay(day) {
        console.log(`Día seleccionado: ${day}`);
        // Aquí se podría abrir un modal para crear evento en esa fecha
    }

    // ===============================================
    // SISTEMA DE VENTAS
    // ===============================================

    setupSalesSystem() {
        // Configurar botones de servicios
        const serviceButtons = document.querySelectorAll('.service-btn');
        serviceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = parseInt(btn.dataset.id);
                const servicePrice = parseFloat(btn.dataset.price);
                const serviceName = btn.textContent.split(' - ')[0];
                
                this.addToCart({
                    id: serviceId,
                    nombre: serviceName,
                    precio: servicePrice,
                    cantidad: 1
                });
            });
        });

        this.loadSalesHistory();
    }

    addToCart(service) {
        const existingItem = this.cart.find(item => item.id === service.id);
        
        if (existingItem) {
            existingItem.cantidad++;
        } else {
            this.cart.push(service);
        }
        
        this.updateCartDisplay();
        this.showNotification(`${service.nombre} agregado al carrito`, 'success');
    }

    removeFromCart(serviceId) {
        this.cart = this.cart.filter(item => item.id !== serviceId);
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;

        cartItems.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong>
                    <br>
                    <small>Cantidad: ${item.cantidad} × S/ ${item.precio.toFixed(2)}</small>
                </div>
                <div>
                    <span>S/ ${itemTotal.toFixed(2)}</span>
                    <button class="btn-icon btn-delete" onclick="sistema.removeFromCart(${item.id})" style="margin-left: 8px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        cartTotal.textContent = total.toFixed(2);

        // Actualizar modal de venta
        const totalPagar = document.getElementById('totalPagar');
        if (totalPagar) {
            totalPagar.value = total.toFixed(2);
        }
    }

    processSale() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'warning');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // Simular venta
        const newSale = {
            id: this.data.ventas.length + 1,
            numero: `VEN${String(this.data.ventas.length + 1).padStart(6, '0')}`,
            cliente: 'Cliente General',
            total: total,
            metodo_pago: 'Efectivo',
            hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' AM'
        };

        this.data.ventas.push(newSale);
        this.cart = [];
        this.updateCartDisplay();
        this.loadSalesHistory();
        
        this.showNotification(`Venta ${newSale.numero} procesada correctamente`, 'success');
        this.openModal('ventaModal');
    }

    loadSalesHistory() {
        const salesTable = document.getElementById('salesTable');
        if (!salesTable) return;

        salesTable.innerHTML = '';

        this.data.ventas.forEach(venta => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venta.numero}</td>
                <td>${venta.cliente}</td>
                <td>S/ ${venta.total.toFixed(2)}</td>
                <td>${venta.metodo_pago}</td>
                <td>${venta.hora}</td>
                <td>
                    <button class="btn-icon btn-print" onclick="sistema.printSale(${venta.id})" title="Imprimir">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            `;
            salesTable.appendChild(row);
        });
    }

    printSale(saleId) {
        const sale = this.data.ventas.find(v => v.id === saleId);
        if (sale) {
            console.log('Imprimiendo venta:', sale);
            this.showNotification('Comprobante enviado a impresora', 'info');
        }
    }

    // ===============================================
    // MODALES
    // ===============================================

    setupModals() {
        // Cerrar modales al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // ===============================================
    // CONFIGURACIÓN Y TABS
    // ===============================================

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Ocultar todas las tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostrar tab seleccionada
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // ===============================================
    // UTILIDADES
    // ===============================================

    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'}-color);
            z-index: 3000;
            min-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}" 
                   style="color: var(--${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'}-color);"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Ocultar automáticamente después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    validateForm(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--danger-color)';
                isValid = false;
            } else {
                field.style.borderColor = 'var(--border-color)';
            }
        });

        return isValid;
    }

    // ===============================================
    // BÚSQUEDA Y FILTROS
    // ===============================================

    setupSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.performSearch(e.target.value, e.target.closest('section').id);
            });
        });
    }

    performSearch(query, section) {
        const normalizedQuery = query.toLowerCase().trim();
        
        switch (section) {
            case 'personas':
                this.searchPersonas(normalizedQuery);
                break;
            case 'servicios':
                this.searchServicios(normalizedQuery);
                break;
            case 'eventos':
                this.searchEventos(normalizedQuery);
                break;
        }
    }

    searchPersonas(query) {
        if (!query) {
            this.loadPersonasTable();
            return;
        }

        const filteredPersonas = this.data.personas.filter(persona => 
            persona.nombres.toLowerCase().includes(query) ||
            persona.apellidos.toLowerCase().includes(query) ||
            persona.num_documento.includes(query) ||
            persona.correo.toLowerCase().includes(query)
        );

        this.renderPersonasTable(filteredPersonas);
    }

    renderPersonasTable(personas) {
        const tbody = document.getElementById('personasTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        personas.forEach(persona => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${persona.num_documento}</td>
                <td>${persona.nombres}</td>
                <td>${persona.apellidos}</td>
                <td>${persona.correo}</td>
                <td>${persona.celular}</td>
                <td><span class="badge ${persona.tipo === 'Empleado' ? 'badge-info' : 'badge-success'}">${persona.tipo}</span></td>
                <td><span class="badge badge-success">${persona.estado}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="sistema.editPersona(${persona.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="sistema.deletePersona(${persona.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// ===============================================
// FUNCIONES GLOBALES
// ===============================================

function openModal(modalId) {
    sistema.openModal(modalId);
}

function closeModal(modalId) {
    sistema.closeModal(modalId);
}

function processSale() {
    sistema.processSale();
}

// ===============================================
// INICIALIZACIÓN
// ===============================================

let sistema;

document.addEventListener('DOMContentLoaded', () => {
    sistema = new ParroquiaSystem();
    
    // Configurar búsqueda después de la inicialización
    sistema.setupSearch();
    
    console.log('Sistema de Gestión Parroquial iniciado correctamente');
});

// ===============================================
// EVENTOS GLOBALES
// ===============================================

// Prevenir envío de formularios (para demo)
document.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    
    if (sistema.validateForm(form)) {
        sistema.showNotification('Formulario enviado correctamente', 'success');
        form.reset();
    } else {
        sistema.showNotification('Por favor complete todos los campos requeridos', 'warning');
    }
});

// Manejar cambios en inputs de moneda
document.addEventListener('input', (e) => {
    if (e.target.type === 'number' && e.target.closest('.modal')) {
        const montoRecibido = parseFloat(e.target.value) || 0;
        const totalPagar = parseFloat(document.getElementById('totalPagar')?.value) || 0;
        const vueltoInput = e.target.closest('form')?.querySelector('input[readonly]:last-of-type');
        
        if (vueltoInput && e.target.previousElementSibling?.textContent === 'Monto Recibido') {
            const vuelto = montoRecibido - totalPagar;
            vueltoInput.value = vuelto >= 0 ? vuelto.toFixed(2) : '0.00';
        }
    }
});

// Manejar teclas de acceso rápido
document.addEventListener('keydown', (e) => {
    // Ctrl + 1-7 para navegación rápida
    if (e.ctrlKey && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const sections = ['dashboard', 'personas', 'servicios', 'eventos', 'ventas', 'reportes', 'configuracion'];
        const sectionIndex = parseInt(e.key) - 1;
        if (sections[sectionIndex]) {
            sistema.navigateToSection(sections[sectionIndex]);
        }
    }
    
    // F2 para nueva persona
    if (e.key === 'F2') {
        e.preventDefault();
        sistema.openModal('personaModal');
    }
    
    // F3 para nueva venta
    if (e.key === 'F3') {
        e.preventDefault();
        sistema.navigateToSection('ventas');
    }
});

// Exportar para uso global
window.sistema = sistema;