import whatsappService from './whatsappService.js';

class MessageHandler {
    constructor() {
        this.conversationState = {};
    }

    async markMessageAsRead(message) {
        if (message?.id) {
            try {
                console.log('Attempting to mark message as read:', message.id);
                await whatsappService.markAsRead(message.id);
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
    }

    async handleIncomingMessage(message, senderInfo) {
        try {
            if (!message || !message.from) {
                console.error('Mensaje inválido:', message);
                return;
            }

            // Mark message as read immediately
            await this.markMessageAsRead(message);
            console.log('Message marked as read:', message.id);

            console.log('Mensaje recibido:', {
                from: message.from,
                type: message.type,
                body: message.type === 'text' ? message.text?.body : 'non-text message'
            });

            switch (message.type) {
                case 'text':
                    if (message.text?.body) {
                        const incomingMessage = message.text.body.toLowerCase().trim();
                        
                        if (this.isGreeting(incomingMessage)) {
                            console.log('Saludo detectado, iniciando nueva conversación');
                            await this.startNewConversation(message.from);
                        } else if (this.conversationState[message.from]) {
                            await this.continueConversationFlow(message.from, incomingMessage);
                        } else {
                            console.log('Mensaje no reconocido como saludo, enviando menú principal');
                            await this.sendMainMenu(message.from);
                        }
                    }
                    break;

                case 'interactive':
                    if (message.interactive?.button_reply?.id) {
                        await this.handleInteractiveMessage(message);
                    }
                    break;

                case 'image':
                case 'video':
                case 'document':
                    await this.handleMediaMessage(message);
                    break;

                default:
                    console.log('Tipo de mensaje no manejado:', message.type);
                    await this.sendMainMenu(message.from);
            }

        } catch (error) {
            console.error('Error detallado:', {
                message: error.message,
                stack: error.stack,
                data: error.response?.data
            });

            try {
                await this.sendErrorMessage(message.from);
                await this.sendMainMenu(message.from);
            } catch (secondaryError) {
                console.error('Error al enviar mensaje de error:', secondaryError);
            }
        }
    }

    isGreeting(message) {
        const greetings = [
            "hola", "hello", "hi", "buenos", "buenas",
            "menu", "ayuda", "help", "servicios"
        ];
        const messageWords = message.toLowerCase().split(/\s+/);
        return messageWords.some(word => greetings.includes(word));
    }

    async startNewConversation(to) {
        try {
            const welcomeMessage = "*¡Bienvenido a Expresos Ñan!* 👋\n\n" +
                                 //"🚚 *Expertos en Mudanzas en Cusco*\n\n" +
                                 //"Soy ÑanBot, tu asistente virtual. Te ayudaré con:\n" +
                                 "✅ Personal profesional\n" +
                                 "✅ Servicio garantizado\n" +
                                 "✅ Atención 24/7\n" +
                                 "✅ Cobertura local y Provincial";

            // 2. Enviar logo
            await this.sendLogo(to);
            await this.delay(1500);
            await whatsappService.sendMessage(to, welcomeMessage);
            await this.delay(1000);

            // 2. Enviar logo
            //await this.sendLogo(to);
            //await this.delay(1500);

            // 3. Mensaje de servicios
            const serviceMessage = "*Nuestros Servicios Principales:*\n\n" +
                                 "🏠 Mudanza Express Todo Incluido\n" +
                                 "📦 Servicio de Carga y Descarga\n" +
                                 "🚛 Fletes Locales y Nacionales";
            
            await whatsappService.sendMessage(to, serviceMessage);
            await this.delay(1000);

            // 4. Enviar menú principal 
            await this.sendMainMenu(to);
        } catch (error) {
            console.error('Error en startNewConversation:', error);
            await this.sendErrorMessage(to);
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async sendImagesSequentially(to) {
        const images = [
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/PERSONAL-EFICIENTE-PARA-CARGAS-Y-MUDANZAS-CUSCO.jpg',
                caption: '✨ Personal eficiente para mudanzas'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/ARMADO-Y-DESARMADO-DE-MUEBLES-CUSCO-MUDANZAS.jpg',
                caption: '🛠️ Servicio de armado y desarmado'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/SERVICIO-DE-DESARMADO-Y-ARMADO-DE-MUEBLES-CUSCO.jpg',
                caption: '👥 Expertos en mudanzas'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/MUDANZAS-DE-DEPARTAMENTO-OFICINAS-HABITACIONES-CUSCO.jpg',
                caption: '🏢 Mudanzas de oficinas y departamentos'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/EMBALAJE-Y-PROTECCION-DE-MUEBLES-CUSCO.jpg',
                caption: '📦 Embalaje y protección profesional'
            }
        ];

        try {
            console.log(`Iniciando envío de ${images.length} imágenes...`);
            const results = await Promise.allSettled(
                images.map(image => 
                    whatsappService.sendMediaMessage(to, 'image', image.url, image.caption)
                )
            );
            
            // Verificar resultados
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    console.log(`✅ Imagen ${index + 1} enviada correctamente`);
                } else {
                    console.error(`❌ Error al enviar imagen ${index + 1}:`, result.reason);
                }
            });

        } catch (error) {
            console.error('Error al enviar imágenes:', error);
        }
    }

    async sendWelcomeImages(to) {
        const images = [
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/PERSONAL-EFICIENTE-PARA-CARGAS-Y-MUDANZAS-CUSCO.jpg',
                caption: '✨ Personal eficiente para mudanzas'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/ARMADO-Y-DESARMADO-DE-MUEBLES-CUSCO-MUDANZAS.jpg',
                caption: '🛠️ Servicio de armado y desarmado'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/SERVICIO-DE-DESARMADO-Y-ARMADO-DE-MUEBLES-CUSCO.jpg',
                caption: '👥 Expertos en mudanzas'
            },
            {
                url: 'https://cuscomudanzas.com/wp-content/uploads/2024/05/MUDANZAS-DE-DEPARTAMENTO-OFICINAS-HABITACIONES-CUSCO.jpg',
                caption: '🏢 Mudanzas de oficinas y departamentos'
            }
        ];

        for (const image of images) {
            try {
                await whatsappService.sendMediaMessage(to, 'image', image.url, image.caption);
                await this.delay(1500); // Esperar 1.5 segundos entre cada imagen
            } catch (error) {
                console.error('Error al enviar imagen:', error);
                continue; // Continuar con la siguiente imagen si hay error
            }
        }
    }

    async sendWelcomeMessage(to) {
        const message = "¡Hola! 👋\n\n" +
                       "Soy ÑanBot, el asistente virtual de *Expresos Ñan*\n" +
                       "Estoy aquí para ayudarte con tu mudanza 🚚\n\n" +
                       "Te mostraré nuestros servicios disponibles...";
        
        await whatsappService.sendMessage(to, message);
    }

    async sendSocialLinks(to) {
        const socialMessage = "*Conéctate con nosotros:*\n\n" +
                            "🌐 *Web:* cuscomudanzas.com\n" +
                            "📘 *Facebook:* facebook.com/expresoqhapaq\n" +
                            "📸 *Instagram:* @expresoqhapaq\n" +
                            "📱 *WhatsApp:* wa.me/51900431121\n\n" +
                            "Síguenos para más novedades y promociones! 🎉";
        
        await whatsappService.sendMessage(to, socialMessage);
    }

    async sendLogo(to) {
        const logoUrl = 'https://cuscomudanzas.com/wp-content/uploads/2024/05/servicio-de-mudanzas-Flete-Carga-Logo-Expreso-Nan.png'; // Reemplazar con URL real
        await whatsappService.sendMediaMessage(to, 'image', logoUrl, '');
    }

    async sendMainMenu(to) {
        const menuMessage = "--------------------------------------------------------- \n\n" //+
                          //"Selecciona una opción:";
        //const menuMessage = "".trim();
        //const menuMessage = ""; // Sin encabezado



        const buttons = [
            {
                type: "reply",
                reply: {
                    id: "services",
                    title: "📋 Ver Servicios"
                }
            },
            {
                type: "reply",
                reply: {
                    id: "moving_tips",
                    title: "💡 Consejos Mudanza"
                }
            },
            {
                type: "reply",
                reply: {
                    id: "info",
                    title: "ℹ️ Información"
                }
            }
        ];
        //await this.sendMessage(to, "\u200B", buttons);


        try {
            await whatsappService.sendMessage(to, menuMessage);
            await this.delay(500);
            await whatsappService.sendInteractiveButtons(
                to,
                "Elige una opción:",
                buttons,
                true // true para mostrar header
            );
        } catch (error) {
            console.error('Error al enviar menú principal:', error);
            await this.sendSimpleMenu(to);
        }
    }

    async sendSimpleMenu(to) {
        const simpleMenu = "*Menú Principal:*\n\n" +
                          "1️⃣ Escribe *SERVICIOS* para ver nuestros servicios\n" +
                          "2️⃣ Escribe *COTIZAR* para solicitar un presupuesto\n" +
                          "3️⃣ Escribe *INFO* para más información";
        
        await whatsappService.sendMessage(to, simpleMenu);
    }

    async handleInteractiveMessage(interaction) {
        try {
            const to = interaction.from;
            const buttonId = interaction.interactive?.button_reply?.id;

            // Mark interactive message as read immediately
            await this.markMessageAsRead(interaction);
            console.log('Interactive message marked as read:', interaction.id);

            console.log('Interacción recibida:', {
                from: to,
                buttonId: buttonId
            });
      
            switch(buttonId) {
                // Menú principal
                case 'services':
                    await this.sendServicesMenu(to);
                    break;
                // Servicios específicos
                case 'express_service':
                    await this.sendExpressServiceDetails(to);
                    break;
                case 'basic_service':
                    await this.sendBasicServiceDetails(to);
                    break;
                case 'flete_service':
                    await this.sendFleteServiceDetails(to);
                    break;
                // Cotizaciones
                case 'quote_express':
                case 'quote_basic':
                case 'quote_flete':
                    await this.sendQuoteForm(to, buttonId);
                    break;
                // Navegación
                case 'back_services':
                    await this.sendServicesMenu(to);
                    break;
                case 'back':
                    await this.sendMainMenu(to);
                    break;
                case 'call_advisor':
                    await this.sendAdvisorContact(to);
                    break;
                case 'social_networks':
                    await this.sendSocialNetworksInfo(to);
                    break;
                case 'schedule_info':
                    await this.sendScheduleDetails(to);
                    break;
                case 'location_info':
                    await this.sendLocationDetails(to);
                    break;
                case 'back_info':
                    await this.sendInfoMenu(to);
                    break;
                case 'info':
                    await this.sendInfoMenu(to);
                    break;
                case 'open_maps':
                    await this.sendGoogleMapsLink(to);
                    break;
                case 'call_direct':
                    await this.sendDirectCallInfo(to);
                    break;
                case 'moving_tips':
                    await this.sendMovingTipsMenu(to);
                    break;
                case 'planning_tips':
                    await this.sendPlanningTips(to);
                    break;
                case 'packing_tips':
                    await this.sendPackingTips(to);
                    break;
                case 'moving_day_tips':
                    await this.sendMovingDayTips(to);
                    break;
                default:
                    console.warn('ID de botón no reconocido:', buttonId);
                    await this.sendMainMenu(to);
            }
        } catch (error) {
            console.error('Error manejando interacción:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendServicesMenu(to) {
        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'express_service',
                    title: '🚚 Mudanza Express'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'basic_service',
                    title: '🏢 Carga/Descarga'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'flete_service',
                    title: '📦 Servicio Flete'
                }
            }
        ];

        try {
            await whatsappService.sendMessage(to, "*🚛 Nuestros Servicios de Mudanza*\nElige el servicio que necesitas:");
            await whatsappService.sendInteractiveButtons(to, "Selecciona una opción:", buttons, false);
        } catch (error) {
            console.error('Error al enviar menú de servicios:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendExpressServiceDetails(to) {
        const message = "*🚚 MUDANZA EXPRESS - Servicio Todo Incluido*\n\n" +
                       "*Descripción Detallada:*\n" +
                       "Nos encargamos de TODO el proceso desde inicio a fin:\n" +
                       "• Empaque profesional de todos tus objetos\n" +
                       "• Desmontaje de muebles\n" +
                       "• Embalaje especializado\n" +
                       "• Personal de carga calificado\n" +
                       "• Transporte seguro\n" +
                       "• Montaje en destino\n" +
                       "• Desempaque y organización\n\n" +
                       "*📋 Criterios para Cotización:*\n" +
                       "1. *Pisos Involucrados:*\n" +
                       "   • Ejemplo: De 1er piso a 5to piso\n" +
                       "   • Acceso a elevador/escaleras\n\n" +
                       "2. *Evaluación de Carga:*\n" +
                       "   • Visita técnica gratuita\n" +
                       "   • Asignación de personal\n" +
                       "   • Selección de vehículos\n" +
                       "   • Planificación logística";

        await this.sendServiceOptionsButtons(to, message, 'express');
    }

    async sendBasicServiceDetails(to) {
        const message = "*🏢 MUDANZA BÁSICA - Carga y Descarga*\n\n" +
                       "*Descripción Detallada:*\n" +
                       "Nos encargamos del proceso de:\n" +
                       "• Carga profesional desde origen\n" +
                       "• Transporte seguro de tus bienes\n" +
                       "• Descarga cuidadosa en destino\n" +
                       "❗ Embalaje y empaque por cuenta del cliente\n\n" +
                       "*📋 Criterios para Cotización:*\n" +
                       "1. *Ubicaciones:*\n" +
                       "   • Pisos de origen y destino\n" +
                       "   • Accesibilidad\n\n" +
                       "2. *Evaluación:*\n" +
                       "   • Fotos/videos de artículos\n" +
                       "   • Lista detallada de muebles\n" +
                       "   • Visita técnica (opcional)";

        await this.sendServiceOptionsButtons(to, message, 'basic');
    }

    async sendFleteServiceDetails(to) {
        const message = "*📦 SERVICIO DE FLETE*\n\n" +
                       "*Descripción Detallada:*\n" +
                       "Asignamos el vehículo ideal según tu carga:\n\n" +
                       "*🚛 Flota Disponible:*\n" +
                       "• Camión 2 toneladas\n" +
                       "• Camión 3 toneladas\n" +
                       "• Camión 4 toneladas\n" +
                       "• Camión 5 toneladas\n\n" +
                       "*📋 Información para Cotizar:*\n" +
                       "• Punto de origen\n" +
                       "• Punto de destino\n" +
                       "• Volumen aproximado de carga\n" +
                       "• Fecha deseada del servicio";

        await this.sendServiceOptionsButtons(to, message, 'flete');
    }

    async sendServiceOptionsButtons(to, message, serviceType) {
        try {
            await whatsappService.sendMessage(to, message);
            
            const buttons = [
                {
                    type: 'reply',
                    reply: {
                        id: `quote_${serviceType}`,
                        title: '📝 Cotizar'
                    }
                },
                {
                    type: 'reply',
                    reply: {
                        id: 'back_services',
                        title: '↩️ Ver Servicios'
                    }
                },
                {
                    type: 'reply',
                    reply: {
                        id: 'back_main',
                        title: '🏠 Menú Principal'
                    }
                }
            ];

            await whatsappService.sendInteractiveButtons(
                to,
                "¿Qué deseas hacer?",
                buttons
            );
        } catch (error) {
            console.error('Error al enviar opciones de servicio:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendQuoteForm(to, serviceType) {
        try {
            let message = "*📋 SOLICITUD DE COTIZACIÓN*\n\n";
            let additionalInfo = "";
            
            switch(serviceType) {
                case 'quote_express':
                    message += "*🚚 Mudanza Express - Todo Incluido*\n\n" +
                             "Para brindarte una cotización precisa, necesitamos:\n\n" +
                             "1. *Ubicaciones:*\n" +
                             "   • Dirección exacta de origen\n" +
                             "   • Número de piso origen\n" +
                             "   • Dirección exacta destino\n" +
                             "   • Número de piso destino\n\n" +
                             "2. *Detalles de Mudanza:*\n" +
                             "   • Lista de muebles principales\n" +
                             "   • Fecha preferida\n" +
                             "   • ¿Hay ascensor disponible?\n\n" +
                             "3. *Servicios Adicionales:*\n" +
                             "   • ¿Necesitas embalaje especial?\n" +
                             "   • ¿Requieres desmontaje/montaje?\n";
                    additionalInfo = "*✨ Incluye:* Empaque, desmontaje, carga, transporte, descarga, montaje y organización";
                    break;
                
                case 'quote_basic':
                    message += "*🏢 Mudanza Básica - Carga y Descarga*\n\n" +
                             "Para cotizar tu servicio, envíanos:\n\n" +
                             "1. *Ubicaciones:*\n" +
                             "   • Dirección de origen y piso\n" +
                             "   • Dirección de destino y piso\n" +
                             "   • ¿Hay acceso para camión?\n\n" +
                             "2. *Documentación:*\n" +
                             "   • Fotos de los muebles\n" +
                             "   • Lista detallada de objetos\n" +
                             "   • Fecha deseada del servicio\n\n" +
                             "3. *Información Adicional:*\n" +
                             "   • Disponibilidad de ascensor\n" +
                             "   • Horario preferido";
                    additionalInfo = "*⚠️ Nota:* El embalaje y empaque no están incluidos en este servicio";
                    break;
                
                case 'quote_flete':
                    message += "*📦 Servicio de Flete*\n\n" +
                             "Proporciona los siguientes datos:\n\n" +
                             "1. *Ruta:*\n" +
                             "   • Dirección exacta de origen\n" +
                             "   • Dirección exacta de destino\n\n" +
                             "2. *Carga:*\n" +
                             "   • Tipo de mercadería\n" +
                             "   • Volumen aproximado\n" +
                             "   • Peso estimado\n\n" +
                             "3. *Servicio:*\n" +
                             "   • Fecha de servicio\n" +
                             "   • Horario preferido";
                    additionalInfo = "*🚛 Nota:* Contamos con vehículos desde 2 hasta 5 toneladas";
                    break;
            }

            message += "\n" + additionalInfo + "\n\n" +
                      "*📱 Responde este mensaje con la información solicitada y un asesor te contactará inmediatamente.*";

            await whatsappService.sendMessage(to, message);
            await this.delay(1000);

            // Botones post-cotización
            const buttons = [
                {
                    type: 'reply',
                    reply: {
                        id: 'back_services',
                        title: '↩️ Ver Servicios'
                    }
                },
                {
                    type: 'reply',
                    reply: {
                        id: 'call_advisor',
                        title: '📞 Llamar Asesor'
                    }
                }
            ];

            await whatsappService.sendInteractiveButtons(
                to,
                "¿Necesitas ayuda adicional?",
                buttons
            );

        } catch (error) {
            console.error('Error al enviar formulario de cotización:', error);
            await this.sendErrorMessage(to);
        }
    }

    async sendScheduleInfo(to) {
        const message = "⏰ Atención 24/7\n\n" +
            "Para reservas en fines de semana y feriados:\n" +
            "• Se requiere 48h de anticipación\n" +
            "• Consulta disponibilidad aquí ➔ [LINK_FORMULARIO]\n\n" +
            "Operamos en Cusco y regiones vecinas 🏔️";

        await whatsappService.sendMessage(to, message);
        await this.sendClosingMessage(to);
    }

    async sendInfoMenu(to) {
        const message = "*📱 Centro de Información*\n" +
                       "¿Qué información deseas conocer?";

        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'social_networks',
                    title: '📱 Redes y Contacto'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'schedule_info',
                    title: '⏰ Horarios'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'location_info',
                    title: '📍 Ubicación'
                }
            }
        ];

        try {
            await whatsappService.sendMessage(to, message);
            await whatsappService.sendInteractiveButtons(to, "Selecciona una opción:", buttons);
        } catch (error) {
            console.error('Error al enviar menú de información:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendErrorMessage(to) {
        const errorMessage = "Disculpa, hubo un problema al procesar tu mensaje. Por favor, intenta nuevamente seleccionando una opción del menú:";
        await whatsappService.sendMessage(to, errorMessage);
    }

    async sendClosingMessage(to) {
        await whatsappService.sendMessage(
            to,
            "¿Necesitas algo más? Siempre estoy aquí para ayudarte 🏔️"
        );
    }

    async handleMediaMessage(message) {
        try {
            const to = message.from;
            
            // Mark media message as read immediately
            await this.markMessageAsRead(message);

            await whatsappService.sendMessage(
                to, 
                "¡Gracias por los archivos! Un asesor los revisará y te contactará pronto."
            );
        } catch (error) {
            console.error('Error handling media message:', error);
            throw error;
        }
    }

    async continueConversationFlow(to, message) {
        // Implementar lógica para continuar flujos de conversación
        console.log('Continuando conversación:', to, message);
    }

    async sendQuoteInfo(to) {
        await whatsappService.sendMessage(
            to, 
            "Para solicitar una cotización, por favor proporciona:\n\n" +
            "1. Origen y destino\n" +
            "2. Fecha aproximada\n" +
            "3. Lista de objetos principales\n\n" +
            "Un asesor te contactará en breve."
        );
        await this.sendMainMenu(to);
    }

    async sendWebInfo(to) {
        await whatsappService.sendMessage(
            to,
            "Visita nuestro sitio web: https://cuscomudanzas.com\n" +
            "Síguenos en Facebook: facebook.com/expresoqhapaq"
        );
        await this.sendMainMenu(to);
    }

    async sendContactInfo(to) {
        await whatsappService.sendMessage(
            to,
            "📞 Contáctanos:\n\n" +
            "☎️ Teléfono: +51 900431121\n" +
            "📧 Email: info@cuscomudanzas.com\n" +
            "🏢 Dirección: Av. Example 123, Cusco"
        );
        await this.sendMainMenu(to);
    }

    async sendDetailedWebInfo(to) {
        try {
            // 1. Enviar información del sitio web
            const webInfo = "*🌐 Nuestra Presencia Digital*\n\n" +
                          "*Sitio Web Oficial:*\n" +
                          "• Web: www.cuscomudanzas.com\n" +
                          "• Cotizaciones online 24/7\n" +
                          "• Calculadora de costos\n" +
                          "• Blog de consejos de mudanza\n\n" +
                          "*Redes Sociales:*\n" +
                          "• Facebook: @expresoqhapaq\n" +
                          "• Instagram: @expresoqhapaq\n" +
                          "• TikTok: @expresoqhapaq\n" +
                          "• YouTube: Expreso Qhapaq Oficial\n\n" +
                          "*Beneficios de seguirnos:*\n" +
                          "• Ofertas exclusivas\n" +
                          "• Tips de mudanza\n" +
                          "• Videos informativos\n" +
                          "• Promociones especiales";

            await whatsappService.sendMessage(to, webInfo);
            await this.delay(1000);

            // 2. Enviar botones de acción
            const buttons = [
                {
                    type: 'reply',
                    reply: {
                        id: 'visit_web',
                        title: 'Visitar Web'
                    }
                },
                {
                    type: 'reply',
                    reply: {
                        id: 'btn_back',
                        title: 'Menu Principal'
                    }
                }
            ];

            await whatsappService.sendInteractiveButtons(
                to,
                "¿Qué deseas hacer?",
                buttons
            );
        } catch (error) {
            console.error('Error al enviar información web:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendDetailedContactInfo(to) {
        try {
            // 1. Enviar información de contacto detallada
            const contactInfo = "*📞 Información de Contacto*\n\n" +
                              "*Central de Atención:*\n" +
                              "• WhatsApp: +51 900431121\n" +
                              "• Teléfono fijo: (084) 123456\n" +
                              "• Emergencias: +51 900431121\n\n" +
                              "*Correos Electrónicos:*\n" +
                              "• Cotizaciones: ventas@cuscomudanzas.com\n" +
                              "• Atención: info@cuscomudanzas.com\n" +
                              "• Reclamos: atención@cuscomudanzas.com\n\n" +
                              "*Horario de Atención:*\n" +
                              "• Lunes a Viernes: 8:00 AM - 8:00 PM\n" +
                              "• Sábados: 8:00 AM - 2:00 PM\n" +
                              "• Emergencias: 24/7\n\n" +
                              "*Oficina Principal:*\n" +
                              "• Av. Example 123, Cusco\n" +
                              "• Referencia: Cerca al Mall Real Plaza";

            await whatsappService.sendMessage(to, contactInfo);
            await this.delay(1000);

            // 2. Enviar botones de acción
            const buttons = [
                {
                    type: 'reply',
                    reply: {
                        id: 'call_now',
                        title: 'Llamar Ahora'
                    }
                },
                {
                    type: 'reply',
                    reply: {
                        id: 'btn_back',
                        title: 'Menu Principal'
                    }
                }
            ];

            await whatsappService.sendInteractiveButtons(
                to,
                "¿Qué deseas hacer?",
                buttons
            );
        } catch (error) {
            console.error('Error al enviar información de contacto:', error);
            await this.sendMainMenu(to);
        }
    }

    async sendAdvisorContact(to) {
        const message = "*👨‍💼 Contacto Directo con Asesor*\n\n" +
                       "Llámanos o escríbenos:\n" +
                       "📞 +51 900431121\n" +
                       "📱 +51 900431121\n\n" +
                       "*⏰ Horario de atención:*\n" +
                       "Lunes a Viernes: 8:00 AM - 8:00 PM\n" +
                       "Sábados: 8:00 AM - 2:00 PM\n" +
                       "Emergencias: 24/7";

        await whatsappService.sendMessage(to, message);
    }

    async sendSocialNetworksInfo(to) {
        const message = "*📱 Conéctate con Expresos Ñan*\n\n" +
                       "*🌐 Sitio Web:*\n" +
                       "• https://cuscomudanzas.com\n\n" +
                       "*Redes Sociales:*\n" +
                       "• Facebook: https://www.facebook.com/ExpresoQhapaq\n" +
                       "• Instagram: https://www.instagram.com/cuscomudanzas1\n" +
                       "• TikTok: https://www.tiktok.com/@mudanzascusco11\n\n" +
                       "*📞 Contacto Directo:*\n" +
                       "• Principal: +51 925671052\n" +
                       "• Alternativo: +51 971966690\n" +
                       "• Emergencias: +51 900431121\n" +
                       "• Email: mudanzasexpresoqhapaq@gmail.com";

        await whatsappService.sendMessage(to, message);
    }

    async sendScheduleDetails(to) {
        const message = "*⏰ Horarios de Atención*\n\n" +
                       "*Servicio 24/7:*\n" +
                       "• Atención todos los días\n" +
                       "• Lunes a Domingo\n" +
                       "• Incluye feriados\n" +
                       "• Servicios de emergencia\n\n" +
                       "*💡 Recomendaciones:*\n" +
                       "• Para mejor atención, programa tu servicio con anticipación\n" +
                       "• Cotizaciones inmediatas 24/7\n" +
                       "• Personal siempre disponible";

        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'back_info',
                    title: '↩️ Volver'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'back',
                    title: '🏠 Menú Principal'
                }
            }
        ];

        await whatsappService.sendMessage(to, message);
        await whatsappService.sendInteractiveButtons(to, "¿Qué deseas hacer?", buttons);
    }

    async sendLocationDetails(to) {
        const locationInfo = "*📍 Nuestra Ubicación*\n\n" +
                           "*Oficina Principal:*\n" +
                           "• René de la Molina 951, Cusco 08004\n\n" +
                           "*Referencias Cercanas:*\n" +
                           "• Mercadillo Santa Rosa\n" +
                           "• Paradero Santa Rosa\n" +
                           "• Centro de Salud Santa Rosa\n\n" +
                           "*Puntos de Referencia:*\n" +
                           "• Entre paradero Santa Rosa y paradero Mercadillo\n" +
                           "• A pasos del Centro de Salud";

        await whatsappService.sendMessage(to, locationInfo);
        await this.delay(1000);

        // 2. Enviar imagen del mapa
        const mapUrl = 'https://cuscomudanzas.com/wp-content/uploads/2024/05/ubicacion-mapa.jpg';
        await whatsappService.sendMediaMessage(to, 'image', mapUrl, 'Nuestra ubicación en Google Maps');
        await this.delay(1000);

        // 3. Enviar botones de acción
        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'open_maps',
                    title: '🗺️ Abrir Mapa'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'back',
                    title: '🏠 Menú Principal'
                }
            }
        ];

        await whatsappService.sendInteractiveButtons(to, "¿Qué deseas hacer?", buttons);
    }

    async sendGoogleMapsLink(to) {
        const message = "*📍 Nuestra Ubicación en Google Maps*\n\n" +
                       "Puedes encontrarnos aquí:\n" +
                       "https://maps.app.goo.gl/pQdNFfEUAU1hzBYz5\n\n" +
                       "*Referencias:*\n" +
                       "• A 2 cuadras del Mall Real Plaza\n" +
                       "• Frente al paradero principal";

        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'back_info',
                    title: '↩️ Volver'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'back',
                    title: '🏠 Menú Principal'
                }
            }
        ];

        await whatsappService.sendMessage(to, message);
        await whatsappService.sendInteractiveButtons(to, "¿Qué deseas hacer?", buttons);
    }

    async sendDirectCallInfo(to) {
        const message = "*📞 Contacto Directo*\n\n" +
                       "*Números de Atención:*\n" +
                       "• Principal: +51 925671052\n" +
                       "• Alternativo: +51 971966690\n" +
                       "• Emergencias: +51 900431121\n\n" +
                       "*Horario de Atención:*\n" +
                       "• Atención 24 horas\n" +
                       "• Todos los días del año\n" +
                       "• Incluye feriados\n\n" +
                       "*📧 Correo Electrónico:*\n" +
                       "• mudanzasexpresoqhapaq@gmail.com\n\n" +
                       "*Haz clic en el número para llamar directamente* ☝️";

        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'back_info',
                    title: '↩️ Volver'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'back',
                    title: '🏠 Menú Principal'
                }
            }
        ];

        await whatsappService.sendMessage(to, message);
        await whatsappService.sendInteractiveButtons(to, "¿Qué deseas hacer?", buttons);
    }

    async sendMovingTipsMenu(to) {
        const message = "*💡 Consejos para tu Mudanza*\n" +
                       "¿Sobre qué tema te gustaría recibir consejos?";

        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'planning_tips',
                    title: '📅 Planificación'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'packing_tips',
                    title: '📦 Empaque'
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'moving_day_tips',
                    title: '🚚 Día de Mudanza'
                }
            }
        ];

        await whatsappService.sendMessage(to, message);
        await whatsappService.sendInteractiveButtons(to, "Selecciona un tema:", buttons);
    }

    async handleTipsResponse(to, tips, tipType) {
        const buttons = [
            {
                type: 'reply',
                reply: {
                    id: 'services',  // Changed from 'quote_now' to 'services'
                    title: '📋 Ver Servicios'  // Changed button text
                }
            },
            {
                type: 'reply',
                reply: {
                    id: 'back',
                    title: '🏠 Menú Principal'
                }
            }
        ];

        await whatsappService.sendMessage(to, tips);
        await whatsappService.sendInteractiveButtons(to, "¿Qué deseas hacer?", buttons);
    }

    async sendPlanningTips(to) {
        const tips = "*📅 Consejos de Planificación*\n\n" +
                    "*1. Con 4-6 semanas de anticipación:*\n" +
                    "• Organiza documentos importantes\n" +
                    "• Haz inventario de tus pertenencias\n" +
                    "• Programa fecha de mudanza\n\n" +
                    "*2. Con 2-3 semanas de anticipación:*\n" +
                    "• Comienza a empacar lo menos usado\n" +
                    "• Separa objetos para donar/vender\n" +
                    "• Notifica cambio de dirección\n\n" +
                    "*3. Una semana antes:*\n" +
                    "• Empaca artículos esenciales aparte\n" +
                    "• Confirma detalles con la mudanza\n" +
                    "• Prepara caja de 'primer día'\n\n" +
                    "*💡 Consejo Pro:* Etiqueta las cajas por habitación y prioridad";
        
        await this.handleTipsResponse(to, tips, 'planning');
    }

    async sendPackingTips(to) {
        const tips = "*📦 Consejos de Empaque*\n\n" +
                    "*Materiales Recomendados:*\n" +
                    "• Cajas de diferentes tamaños\n" +
                    "• Cinta de embalaje resistente\n" +
                    "• Papel burbuja y periódico\n" +
                    "• Marcadores para etiquetar\n\n" +
                    "*Técnicas de Empaque:*\n" +
                    "• Objetos pesados en cajas pequeñas\n" +
                    "• Protege objetos frágiles con burbujas\n" +
                    "• Llena espacios vacíos en cajas\n" +
                    "• Etiqueta todas las cajas claramente\n\n" +
                    "*🎯 Tips Especiales:*\n" +
                    "• Toma fotos de conexiones electrónicas\n" +
                    "• Guarda tornillos en bolsas etiquetadas\n" +
                    "• Empaca por habitación\n" +
                    "• No sobrecargues las cajas";
        
        await this.handleTipsResponse(to, tips, 'packing');
    }

    async sendMovingDayTips(to) {
        const tips = "*🚚 Consejos para el Día de la Mudanza*\n\n" +
                    "*Antes de la Mudanza:*\n" +
                    "• Ten documentos importantes a mano\n" +
                    "• Prepara refrigerios y agua\n" +
                    "• Asegura accesos y estacionamientos\n\n" +
                    "*Durante la Mudanza:*\n" +
                    "• Supervisa la carga y descarga\n" +
                    "• Mantén despejados los accesos\n" +
                    "• Indica prioridades de descarga\n\n" +
                    "*Después de la Mudanza:*\n" +
                    "• Revisa el inventario\n" +
                    "• Prioriza habitaciones esenciales\n" +
                    "• Verifica servicios básicos\n\n" +
                    "*⚡ Tip Importante:* Ten una caja con artículos esenciales para el primer día";
        
        await this.handleTipsResponse(to, tips, 'moving_day');
    }
}

export default new MessageHandler();