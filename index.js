const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./swagger.yaml');
const ERR_401 = {message: "Unauthorized"}
var expressWs = require('express-ws')(app);
 
let users = [{"id": 1, "email": "admin", "password": "password"}]
let notes = [{"id": 1, "createdAt": "1999-12-31 00:00:00", "title": "string", "content": "string"}]
let sessions = [{"id": 1, "userId": 1, "createdAt": "1999-12-31 00:00:00"}]

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const delay = ms => new Promise(res => setTimeout(res, ms));
app.get('/notes', async (req, res) => { await delay(1000);
    res.send(notes)
})

app.use(express.json());


// Serve static files
app.use(express.static('public'));

app.use(function (req, res, next) {

    const authHeader = req.headers.authorization;
    if (authHeader) {
        req.sessionId = parseInt(authHeader.split(' ')[1]);
        const session = sessions.find(session => session.id === req.sessionId);
        if (!session) {
            return res.status(401).send(ERR_401);
        }
        req.userId = session.userId;
    }
    next();
})
app.ws('/', function(ws, req) {
});

function requireLogin(req, res, next) {
    if (req.sessionId) {
        next();
    } else {
        res.status(401).send(ERR_401);
    }
}

app.delete("/notes/:id", requireLogin, (req, res) => {
    const id = parseInt(req.params.id);
    const note = notes.find(note => note.id === id);
    if (!note) {
        return res.status(404).send({message: "Note not found"});
    }
    notes = notes.filter(note => note.id !== id);
    expressWs.getWss().clients.forEach(client => client.send(JSON.stringify({event: 'delete', data: note.id})));
    res.status(204).end();
});

app.post('/notes', requireLogin, (req, res) => {

    // Check required fields
    if (!req.body.title || !req.body.content) {
        return res.status(400).send({message: "Some or all fields are missing"});
    }

    // Check if id is present and if it is, return error
    if (req.body.id) {
        return res.status(400).send({message: "Id is not allowed"});
    }

    // Create new note
    const newNote = {
        id: notes.reduce((acc, cur) => Math.max(acc, cur.id), 0) + 1,
        createdAt: new Date().toISOString(),
        title: req.body.title,
        content: req.body.content
    }


    notes.push(newNote)
      expressWs.getWss().clients.forEach(client => client.send(JSON.stringify({event: 'add', data: newNote})))
      


    res.status(201).send(newNote)

})

app.post('/sessions', (req, res) => {
    // Validate request
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({message: "Some or all fields are missing"});
    }

    // Check if user exists
    const user = users.find(user => user.email === req.body.email);
    if (!user) {
        return res.status(404).send({message: "User not found"});
    }

    // Check if password is correct
    if (user.password !== req.body.password) {
        return res.status(400).send({message: "Invalid password"});
    }

    // Create a random session id using maximum value allowed for integer
    const sessionId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    // Create new session
    const newSession = {
        id: sessionId,
        userId: user.id,
        createdAt: new Date().toISOString()
    }

    // Add session to sessions
    sessions.push(newSession);

    // Return session id
    res.status(201).send({sessionId: sessionId});
})

app.patch('/notes/:id', requireLogin, (req, res) => {
    const id = parseInt(req.params.id);
    const note = notes.find(note => note.id === id);
    if (!note) {
        return res.status(404).send({message: "Note not found"});
    }
    if (req.body.title) {
        note.title = req.body.title;
    }
    if (req.body.content) {
        note.content = req.body.content;
    }
    expressWs.getWss().clients.forEach(client => client.send(JSON.stringify({event: 'edit', data: note})))
  
    res.status(204).end();
})

app.listen(3000, () => console.log('http://localhost:3000/docs'))
