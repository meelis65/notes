const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./swagger.yaml');
const notes = [{"createdAt": "1999-12-31 00:00:00", "title": "string", "content": "string"}]
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/notes', (req, res) => {
    res.send(notes)
})
app.listen(3000, () => console.log('http://localhost:3000/docs'))
