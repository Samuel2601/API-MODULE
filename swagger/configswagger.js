// configswagger.js

//facebook: 362526216239241
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'API Documentación',
    },
    servers: [
      {
        url: 'http://localhost:4202',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        Authorization: { // nombre arbitrario para el esquema de seguridad
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // opcional, valor arbitrario para propósitos de documentación
        },
        oAuthFacebook: {
          type: 'oauth2',
          description: 'Autenticación con Facebook',
          flows: {
            implicit: {
              authorizationUrl: 'https://www.facebook.com/v19.0/dialog/oauth?client_id={app-id}&redirect_uri={"https://www.domain.com/login"}&state={"{st=state123abc,ds=123456789}"}',
              scopes: {
                email: 'Acceso al correo electrónico',
              },
            },
          },
        },
        oAuthGoogle: {
          type: 'oauth2',
          description: 'Autenticación con Google',
          flows: {
            implicit: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              client_id:'700625404417-apcets2tvdf368bquike6ip6hcckgthb.apps.googleusercontent.com',
              response_type: 'token',
              scopes: 'https://www.googleapis.com/auth/drive.metadata.readonly',
              include_granted_scopes: 'true',
              state:'pass-through value'
            },
          },
        },
      },
    },
    //security: [{ Authorization: [] }], // Aplica la seguridad globalmente a todas las operaciones
  },
  apis: ['./userModule/routes/*.js'], // Rutas donde están tus definiciones de Swagger
};

export { swaggerOptions };
