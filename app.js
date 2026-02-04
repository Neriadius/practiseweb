const express = require('express');

const app = express();
const PORT = 3000;
const fs = require("fs");
const path = require("path");

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.urlencoded({ extended: true }))

// Example route
app.get('/sum', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);
  res.send(`Sum: ${a + b}`);
});

app.use(express.static('public'));

app.post('/submit', (req, res) => { 
  const { name, email, message } = req.body; 
  res.send(`Name: ${name}, Email: ${email}, Message: ${message}`); 
}); 

app.post('/hello', (req, res) => {
  res.send('Hello');
})
app.post('/user/:id', (req, res) => {
  res.send('User id is -098765432234567890');
})
app.post('/status', (req, res) => {
  res.send('Status is work');
})
app.post('/sum', (req, res) => {
  const validation = 10, status = 400;
  res.send(validation + status);
})

//practice 6
app.get("/fast", (req, res) => {
  res.json({
    route: "/fast",
    message: "Fast response"
  });
});

app.get("/slow-async", async (req, res) => {
  setTimeout(() => {
    res.json({
      route: "/slow-async",
      delayMs: 3000,
      type: "async"
    });
  }, 3000);
});

app.get("/slow-blocking", (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 3000) {
  }
  
  res.json({
    route: "/slow-blocking",
    delayMs: 3000,
    type: "blocking"
  });
});

app.get("/file-async", (req, res) => {
  const filePath = path.join(__dirname, "data.txt");
  
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to read file"
      });
    }
    
    res.json({
      route: "/file-async",
      bytes: Buffer.byteLength(data, "utf8"),
      preview: data.slice(0, 50)
    });
  });
});

app.get("/status", (req, res) => {
  res.json({
    server: "running",
    time: new Date().toISOString()
  });
});

app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
