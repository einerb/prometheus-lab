const http = require("http");
const url = require("url");
const client = require("prom-client");

// Crear un registro que registre las métricas
const register = new client.Registry();

// Agregar una etiqueta por default que se añade a todas las métricas
register.setDefaultLabels({
  app: "example-nodejs-app",
});

// Habilitar la colección de métricas por default
client.collectDefaultMetrics({ register });

// Crear una métrica de histograma
const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Registrar histograma creado
register.registerMetric(httpRequestDurationMicroseconds);

// Crear servidor HTTP
const server = http.createServer(async (req, res) => {
  // Start timer
  const end = httpRequestDurationMicroseconds.startTimer();

  // Recuperar la ruta del objeto de la solicitud
  const route = url.parse(req.url).pathname;

  if (route === "/metrics") {
    // Devuelve todas las métricas al formato Prometheus
    res.setHeader("Content-Type", register.contentType);
    res.end(register.metrics());
  }

  // End el timer y añadir etiquetas
  end({ route, code: res.statusCode, method: req.method });
});

// Correr server Port 8080
server.listen(8080);
