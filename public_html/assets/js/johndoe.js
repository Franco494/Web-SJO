/*!
=========================================================
* JohnDoe Landing page
=========================================================

* Copyright: 2019 DevCRUD (https://devcrud.com)
* Licensed: (https://devcrud.com/licenses)
* Coded by www.devcrud.com

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// smooth scroll
$(document).ready(function(){
    $(".navbar .nav-link").on('click', function(event) {

        if (this.hash !== "") {

            event.preventDefault();

            var hash = this.hash;

            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 700, function(){
                window.location.hash = hash;
            });
        } 
    });
});

// protfolio filters
$(window).on("load", function() {
    var t = $(".portfolio-container");
    t.isotope({
        filter: ".new",
        animationOptions: {
            duration: 750,
            easing: "linear",
            queue: !1
        }
    }), $(".filters a").click(function() {
        $(".filters .active").removeClass("active"), $(this).addClass("active");
        var i = $(this).attr("data-filter");
        return t.isotope({
            filter: i,
            animationOptions: {
                duration: 750,
                easing: "linear",
                queue: !1
            }
        }), !1
    });
});


// google maps
function initMap() {
// Styles a map in night mode.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -14.056491905163162, lng: -75.74787621974991}, 
        zoom: 15,
        scrollwheel:  false,
        navigationControl: false,
        mapTypeControl: false,
        scaleControl: false,
      styles: [
        {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
        {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
        {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{color: '#263c3f'}]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{color: '#6b9a76'}]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{color: '#38414e'}]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{color: '#212a37'}]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{color: '#9ca5b3'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{color: '#746855'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{color: '#1f2835'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{color: '#f3d19c'}]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{color: '#2f3948'}]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{color: '#17263c'}]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{color: '#515c6d'}]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{color: '#17263c'}]
        }
      ]
    });    
}

const menusItemsDropdown = document.querySelectorAll('.menu-item-dropdown');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');



menusItemsDropdown.forEach((menuItem) => {
    menuItem.addEventListener('click', () => {
        const subMenu = menuItem.querySelector('.sub-menu');
        const isActive = menuItem.classList.toggle('sub-menu-toggle');
        if (subMenu){
          if (isActive) {
              subMenu.style.height = `${subMenu.scrollHeight + 6}px`;
              subMenu.style.padding = '0.2rem 0';
          }
          else {
              subMenu.style.height = '0';
              subMenu.style.padding = '0';
          }
        }
        menusItemsDropdown.forEach((item) => {
            if (item !== menuItem) {
                const otherSubMenu = item.querySelector('.sub-menu');
                if (otherSubMenu) {
                    item.classList.remove('sub-menu-toggle');
                    otherSubMenu.style.height = '0';
                    otherSubMenu.style.padding = '0';
                }
            }
        });  
    });
});

// Funcionalidad para el formulario de contacto
// Agrega este código al final de tu archivo johndoe.js

// Inicializar EmailJS (necesitas registrarte en https://www.emailjs.com/)
(function(){
    emailjs.init("7ldZOAZbKDxQlKH0A"); // Reemplaza con tu public key de EmailJS
})();

// Función para enviar el formulario
function sendEmail(event) {
    event.preventDefault(); // Prevenir el envío normal del formulario
    
    // Obtener los valores del formulario
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const message = form.querySelector('textarea').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validación básica
    if (!name || !email || !message) {
        showMessage('Por favor, completa todos los campos requeridos.', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor, ingresa un email válido.', 'error');
        return;
    }
    
    // Cambiar texto del botón mientras se envía
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ti-reload"></i> Enviando...';
    submitBtn.disabled = true;
    
    // Parámetros para el template de EmailJS
    const templateParams = {
        from_name: name,
        from_email: email,
        message: message,
        to_email: 'cupejoaquin1@gmail.com'
    };
    
    // Enviar email usando EmailJS
    emailjs.send('service_2bfgmmi', 'template_8b1lzp4', templateParams)
        .then(function(response) {
            console.log('Email enviado exitosamente!', response.status, response.text);
            showMessage('¡Mensaje enviado exitosamente! Te contactaremos pronto.', 'success');
            form.reset(); // Limpiar el formulario
        }, function(error) {
            console.log('Error al enviar el email:', error);
            showMessage('Error al enviar el mensaje. Por favor, intenta nuevamente.', 'error');
        })
        .finally(function() {
            // Restaurar el botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Función para mostrar mensajes al usuario
function showMessage(message, type) {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
    `;
    
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(messageDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Agregar el event listener al formulario cuando el DOM esté listo
$(document).ready(function() {
    const contactForm = document.querySelector('.contact-form-card form');
    if (contactForm) {
        contactForm.addEventListener('submit', sendEmail);
    }
});

// Alternativa sin EmailJS usando Formspree (más simple)
// Si prefieres usar Formspree, reemplaza la función sendEmail con esta:
/*
function sendEmailWithFormspree(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Cambiar texto del botón
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ti-reload"></i> Enviando...';
    submitBtn.disabled = true;
    
    fetch('https://formspree.io/f/TU_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showMessage('¡Mensaje enviado exitosamente!', 'success');
            form.reset();
        } else {
            throw new Error('Error en el servidor');
        }
    })
    .catch(error => {
        showMessage('Error al enviar el mensaje. Intenta nuevamente.', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}
*/

