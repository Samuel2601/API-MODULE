// whatsapp.js
import fetch from 'node-fetch';
import apiResponse from '../../../helpers/sendstatus.js';

const sendWhatsAppMessage = async (accessToken,idTelefono, recipient, message, template_name, template_language,template_values) => {
  const url = `https://graph.facebook.com/v19.0/${idTelefono}/messages`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  let data;

  if (message) {
    data = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'text',
      text: {
        "body": message
      }
    };
  } else if (template_name && template_language) {
    data = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: template_name,
        language: { code: template_language },
        components: [
            {
              type: 'BODY',
              parameters: template_values
            }
          ]
      }
    };
  } else {
    console.error('Invalid parameters');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log(result);
    return apiResponse(200, result.error?'ERROR':'Respuesta:', result.error?null:result, result.error?result:null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, 'ERROR', null, error);
  }
};

export default sendWhatsAppMessage;