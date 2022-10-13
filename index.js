const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./swagger.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, ()=>console.log('http://localhost:3000/docs'))
