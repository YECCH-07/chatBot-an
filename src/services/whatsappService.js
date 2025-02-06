// whatsappService.js
import sendToWhatsApp from './http-request/sendToWhatsApp.js';

class WhatsAppService {
  async sendMessage(to, body) {
    if (!to || !body) {
      throw new Error('Parámetros inválidos: se requiere "to" y "body"');
    }

    const messageData = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body, preview_url: false }
    };

    try {
      return await sendToWhatsApp(messageData);
    } catch (error) {
      console.error('Error al enviar mensaje:', {
        to,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async markAsRead(messageId) {
    if (!messageId) {
      console.warn('No message ID provided for marking as read');
      return;
    }

    const readData = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    try {
      console.log('Marking message as read:', messageId);
      const response = await sendToWhatsApp(readData, 3, 500); // 3 retries, 500ms delay
      console.log('Successfully marked message as read:', messageId);
      return response;
    } catch (error) {
      console.error('Failed to mark message as read:', {
        messageId,
        error: error.message
      });
      // Don't throw error to prevent disrupting the conversation flow
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    if (!to || !bodyText || !buttons || !Array.isArray(buttons) || !buttons.length) {
      throw new Error('Parámetros inválidos para botones interactivos');
    }

    // Asegurar que el formato cumpla con los requisitos de Meta
    const formattedButtons = buttons.map(button => ({
      type: "reply",
      reply: {
        id: button.reply.id.substring(0, 256).replace(/[^a-zA-Z0-9_]/g, ''),
        title: button.reply.title.substring(0, 20)
      }
    }));

    const buttonData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "🚚 ÑanBot | Asistente de Mudanzas"  // Nuevo encabezado más personalizado
        },
        body: {
          text: bodyText
        },
        action: {
          buttons: formattedButtons.slice(0, 3)
        }
      }
    };

    try {
      console.log('Enviando datos a WhatsApp API:', JSON.stringify(buttonData, null, 2));
      return await sendToWhatsApp(buttonData);
    } catch (error) {
      console.error('Error al enviar botones interactivos:', {
        to,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption = '') {
    if (!to || !type || !mediaUrl) {
      throw new Error('Parámetros inválidos para enviar medio');
    }

    const mediaData = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: type,
      [type]: {
        link: mediaUrl,
        caption: caption || ''
      }
    };

    try {
      console.log(`Enviando ${type}:`, {
        to,
        url: mediaUrl,
        caption: caption
      });
      
      const response = await sendToWhatsApp(mediaData);
      console.log(`${type} enviado exitosamente:`, response);
      return response;
    } catch (error) {
      console.error(`Error enviando ${type}:`, {
        to,
        url: mediaUrl,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }
}

export default new WhatsAppService();
