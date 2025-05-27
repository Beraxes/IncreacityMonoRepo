
<div id="top">

<!-- ENCABEZADO ESTILO: CLÁSICO -->
<div align="center">

# INCREACITYMONOREPO

<!-- INSIGNIAS -->
<img src="https://img.shields.io/github/last-commit/Beraxes/IncreacityMonoRepo?style=flat&logo=git&logoColor=white&color=0080ff" alt="último commit">
<img src="https://img.shields.io/github/languages/top/Beraxes/IncreacityMonoRepo?style=flat&color=0080ff" alt="lenguaje principal del repositorio">
<img src="https://img.shields.io/github/languages/count/Beraxes/IncreacityMonoRepo?style=flat&color=0080ff" alt="conteo de lenguajes del repositorio">

<em>Construido con las siguientes herramientas y tecnologías:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Autoprefixer-DD3735.svg?style=flat&logo=Autoprefixer&logoColor=white" alt="Autoprefixer">
<img src="https://img.shields.io/badge/TypeORM-FE0803.svg?style=flat&logo=TypeORM&logoColor=white" alt="TypeORM">
<img src="https://img.shields.io/badge/Mongoose-F04D35.svg?style=flat&logo=Mongoose&logoColor=white" alt="Mongoose">
<img src="https://img.shields.io/badge/PostCSS-DD3A0A.svg?style=flat&logo=PostCSS&logoColor=white" alt="PostCSS">
<img src="https://img.shields.io/badge/Prettier-F7B93E.svg?style=flat&logo=Prettier&logoColor=black" alt="Prettier">
<img src="https://img.shields.io/badge/.ENV-ECD53F.svg?style=flat&logo=dotenv&logoColor=black" alt=".ENV">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<br>
<img src="https://img.shields.io/badge/MongoDB-47A248.svg?style=flat&logo=MongoDB&logoColor=white" alt="MongoDB">
<img src="https://img.shields.io/badge/Passport-34E27A.svg?style=flat&logo=Passport&logoColor=white" alt="Passport">
<img src="https://img.shields.io/badge/Vue.js-4FC08D.svg?style=flat&logo=vuedotjs&logoColor=white" alt="Vue.js">
<img src="https://img.shields.io/badge/Yarn-2C8EBB.svg?style=flat&logo=Yarn&logoColor=white" alt="Yarn">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/tsnode-3178C6.svg?style=flat&logo=ts-node&logoColor=white" alt="tsnode">
<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/Jest-C21325.svg?style=flat&logo=Jest&logoColor=white" alt="Jest">

</div>
<br>

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Justificación de Tecnologías Utilizadas](#resumen)
- [Primeros Pasos](#primeros-pasos)
    - [Requisitos Previos](#requisitos-previos)
    - [Instalación](#instalación)
    - [Uso](#uso)

---

## Resumen

**IncreacityMonoRepo** es fork the un proyecto previamente hecho pero modificado para hacer la prueba tecnica de increacity.

Este proyecto incluyen:

- 🚀 **Repositorio Centralizado:** Simplifica la colaboración y reutilización de código entre equipos.
- 🛠️ **Desarrollado con NestJS:** Facilita el desarrollo escalable de aplicaciones del lado del servidor con una arquitectura robusta.
- 🔒 **Gestión de API Completa:** Simplifica la autenticación, las interacciones con bases de datos y la configuración del entorno.
- 📦 **Arquitectura Modular:** Promueve el mantenimiento y mejora la productividad mediante una estructura organizada de código.
- 🛡️ **Integración con TypeScript:** Asegura la tipificación estricta y mejora la calidad del código en todo el proyecto.
- 🌐 **Capacidades PWA:** Mejora la experiencia del usuario con funcionalidad offline y actualizaciones fluidas.

---
## Justificación de Tecnologías Utilizadas
- **Frontend (Client):** 
	- **Vue.js:** Se eligió por su familiaridad, su arquitectura basada en componentes que fomenta la reutilización y organización del código, y su curva de aprendizaje relativamente accesible. Se aplicó el principio de única responsabilidad al separar la lógica en los componentes para mejorar la mantenibilidad.
	- **Vite:** Se incorporó como herramienta de construcción para el frontend debido a su velocidad y eficiencia, especialmente en el desarrollo y la generación de builds optimizados para la producción. Su capacidad para crear Progressive Web Apps (PWAs) fue un factor clave para mejorar la experiencia del usuario con funcionalidades offline y actualizaciones fluidas.
- **Backend (API):** 
	- **NestJS:** La decisión de utilizar NestJS se fundamentó en su arquitectura robusta y su enfoque en los principios SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion). Al ser un framework progresivo para Node.js basado en TypeScript, facilita la creación de aplicaciones escalables y mantenibles, promoviendo un código limpio y bien estructurado.
	- **MongoDB:** Se seleccionó como base de datos NoSQL por su flexibilidad y escalabilidad, lo que permite adaptarse a las necesidades cambiantes del proyecto. Su integración con JavaScript y su modelo de documentos se complementan bien con el entorno de desarrollo.
    
**Explicacion extensa de online/offline:**[Implementacion](IMPLEMENTACION.md)
## Primeros Pasos

### Requisitos Previos

Este proyecto requiere las siguientes dependencias:

- **Lenguaje de Programación:** TypeScript  
- **Gestor de Paquetes:** npm, Yarn

### Estructura del proyecto
```sh
└── IncreacityMonoRepo/
    ├── README.md
    ├── api
    │   ├── .env.example
    │   ├── .eslintrc.js
    │   ├── .gitignore
    │   ├── .prettierrc
    │   ├── README.md
    │   ├── nest-cli.json
    │   ├── package.json
    │   ├── public
    │   ├── src
    │   ├── test
    │   ├── tsconfig.build.json
    │   ├── tsconfig.json
    │   └── yarn.lock
    └── client
        ├── .env.example
        ├── .gitattributes
        ├── .gitignore
        ├── .prettierrc.json
        ├── .vscode
        ├── README.md
        ├── env.d.ts
        ├── index.html
        ├── package.json
        ├── postcss.config.js
        ├── public
        ├── src
        ├── tailwind.config.js
        ├── tsconfig.app.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── vite.config.ts
        └── yarn.lock
```

### Instalación

Construye IncreacityMonoRepo desde el código fuente e instala las dependencias:

1. **Clona el repositorio:**

```sh
git clone https://github.com/Beraxes/IncreacityMonoRepo
```

2. **Navega al directorio del proyecto:**

```sh
cd IncreacityMonoRepo
```

3. **Instala las dependencias:**

**Usando [yarn](https://yarnpkg.com/):**

```sh
cd api
yarn
```
En una nueva consola
```sh
cd client
yarn
```
### Configuración de Entorno

Tanto el proyecto del servidor (`api`) como el del cliente (`client`) requieren variables de entorno para funcionar correctamente. Cada uno incluye un archivo `.env.example` con los valores de ejemplo.

#### Para configurarlos:

1. Dirígete a la carpeta correspondiente:
   ```sh
   cd api
   ```
2. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```sh
   cp .env.example .env
   ```
3. Repite el proceso para el cliente:
   ```sh
   cd ../client
   cp .env.example .env
   ```

4. Edita los archivos `.env` según las configuraciones necesarias para tu entorno local (puertos, claves API, URLs, etc.).

> ⚠️ **Importante:** No compartas los archivos `.env` en repositorios públicos, ya que pueden contener información sensible.

### Uso

Ejecuta el proyecto con:

```sh
cd api
yarn start:dev
```
```sh
cd client
yarn dev
```

---


---

## Créditos

Fork  de:  
🔗 [TaskManager - Repositorio original](https://github.com/Beraxes/taskmanager)


<div align="left"><a href="#top">⬆ Volver arriba</a></div>

---
