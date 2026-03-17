# Web Environment

React + TypeScript preparado con estructura Vite y librerias para animacion y graficas:

- `framer-motion`
- `recharts`

Comandos:

```bash
npm install
npm run dev
```

Configurar URL de API (opcional):

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

El login hashea la contrasena en frontend con `SHA-256` y envia:

```json
{
  "correo": "tu@email.com",
  "password": "<hash_sha256_hex>"
}
```

El registro envia:

```json
{
  "correo": "tu@email.com",
  "usuario": "tu_usuario",
  "password": "<hash_sha256_hex>"
}
```

Docker:

```bash
docker build -t capital-web .
docker run --rm -p 8080:80 capital-web
```

Modelos financieros de frontend:

- `src/services/financialModels.ts`
