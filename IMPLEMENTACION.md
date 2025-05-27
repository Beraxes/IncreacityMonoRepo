
# Vue Task Manager: Implementación Online/Offline Explicada

## Visión General
Vue Task Manager implementa un enfoque robusto centrado en el modo offline que permite a los usuarios trabajar sin interrupciones, ya sea que estén en línea o sin conexión. Así es como funciona:

## 🏗️ Componentes de Arquitectura

### 1. **Detección de Red (`useNetwork.ts`)**
```typescript
// Detecta cuándo el usuario está en línea/sin conexión
const isOnline = ref<boolean>(navigator.onLine)

window.addEventListener("online", updateOnlineStatus)
window.addEventListener("offline", updateOnlineStatus)
```
- **Qué hace**: Monitorea el estado de red del navegador  
- **Cómo funciona**: Usa APIs del navegador para detectar cambios de conectividad  
- **Resultado**: Proporciona el estado `isOnline` en tiempo real en toda la app

### 2. **Almacenamiento Local (`storage.ts`)**
```typescript
// Guarda tareas localmente en el almacenamiento del navegador
saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

// Guarda operaciones pendientes de sincronización
savePendingSync(syncItems: SyncItem[]): void {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(syncItems))
}
```
- **Qué hace**: Persiste datos en el `localStorage` del navegador  
- **Cómo funciona**: Almacena tareas y cola de sincronización incluso si se cierra la app  
- **Resultado**: Los datos sobreviven reinicios del navegador y períodos sin conexión

### 3. **Sistema de Cola de Sincronización (`useTasks.ts`)**
```typescript
// Cuando está sin conexión, las operaciones se encolan para sincronizar luego
const markTaskForSync = (task: Task, operation: "create" | "update" | "delete") => {
  const syncItem: SyncItem = {
    localId: task.id,
    task: { ...task },
    operation,
    timestamp: Date.now(),
  }
  pendingSync.value.push(syncItem)
}
```
- **Qué hace**: Encola operaciones que no pudieron enviarse al servidor  
- **Cómo funciona**: Almacena cada acción (crear/actualizar/eliminar) con metadatos  
- **Resultado**: No se pierde información cuando no hay conexión

## 🔄 Cómo Funciona: Paso a Paso

### **Escenario 1: El Usuario Se Queda Sin Conexión**

1. **Detección de Red**
   ```typescript
   // La app detecta el estado offline
   isOnline.value = false
   ```

2. **Actualizaciones en la Interfaz**
   ```vue
   <!-- Aparece una banda roja -->
   <div class="bg-red-100 text-red-800">
     Sin conexión - Los cambios se sincronizarán al volver en línea
   </div>
   ```

3. **Las Operaciones con Tareas Continúan**
   ```typescript
   // El usuario añade una tarea sin conexión
   const addTask = async (task: Task) => {
     tasks.value.push(task) // ✅ Añadida al arreglo local
     storage.saveTasks(tasks.value) // ✅ Guardada en localStorage

     if (!isOnline.value) {
       markTaskForSync(task, "create") // ✅ Encolada para sincronización
       showToast("Offline", "Tarea guardada localmente")
     }
   }
   ```

### **Escenario 2: El Usuario Recupera la Conexión**

1. **Detección de Red**
   ```typescript
   // La app detecta el estado en línea
   watch(isOnline, async (online) => {
     if (online && pendingSync.value.length > 0) {
       await syncTasksWithAPI() // 🚀 Sincronización automática activada
     }
   })
   ```

2. **Inicia el Proceso de Sincronización**
   ```typescript
   const syncTasksWithAPI = async () => {
     isSyncing.value = true // 🔵 Banda azul de "sincronizando"

     // Procesa cada operación en cola
     for (const syncItem of pendingSync.value) {
       if (syncItem.operation === "create") {
         const createdTask = await tasksAPI.createTask(syncItem.task)
         // Actualiza la tarea local con el ID del servidor
       }
     }

     pendingSync.value = [] // Limpia la cola de sincronización
     isSyncing.value = false // ✅ Sincronización completa
   }
   ```

3. **Actualizaciones en la Interfaz**
   ```vue
   <!-- Banda verde que muestra éxito brevemente -->
   <div class="bg-green-100 text-green-800">
     Todas las tareas sincronizadas
   </div>
   ```

## 🎯 Indicadores Visuales

### **Indicadores en las Tarjetas de Tareas**
```vue
<!-- Pequeños puntos de colores en cada tarea -->
<div v-if="!isSynced" class="h-2 w-2 rounded-full bg-amber-400" title="Pendiente de sincronizar"></div>
<div v-else-if="task._id" class="h-2 w-2 rounded-full bg-green-400" title="Sincronizada"></div>
<div v-else class="h-2 w-2 rounded-full bg-gray-400" title="Solo local"></div>
```

- 🔴 **Rojo**: Error al sincronizar la tarea  
- 🟡 **Ámbar**: Tarea pendiente de sincronización  
- 🟢 **Verde**: Tarea sincronizada con el servidor  
- ⚪ **Gris**: Tarea solo local (modo invitado)

### **Colores de la Barra de Estado**
- 🔴 **Rojo**: "Sin conexión - Los cambios se sincronizarán al volver en línea"  
- 🔵 **Azul**: "Sincronizando tareas..." (con ícono girando)  
- 🟡 **Ámbar**: "X tareas pendientes de sincronizar"  
- 🟢 **Verde**: "Todas las tareas sincronizadas"

## 🛡️ Funciones de Seguridad de Datos

### **1. Resolución de Conflictos**
```typescript
// Los datos del servidor tienen prioridad, pero se conservan los cambios locales
const mergedTasks = [...localTasks]
for (const serverTask of serverTasks) {
  const existsLocally = mergedTasks.some(local => local._id === serverTask._id)
  if (!existsLocally) {
    mergedTasks.push(serverTask) // Añade nuevas tareas del servidor
  }
}
```

### **2. Lógica de Reintento**
```typescript
// Reintento automático de sincronización cada 5 minutos cuando hay conexión
setInterval(() => {
  if (!isSyncing.value && pendingSync.value.length > 0) {
    syncTasksWithAPI()
  }
}, 5 * 60 * 1000)
```

### **3. Manejo de Errores**
```typescript
try {
  await tasksAPI.createTask(task)
} catch (error) {
  if (error.message === "TokenExpired") {
    handleUnauthorized() // Cierra la sesión del usuario
  } else {
    markTaskForSync(task, "create") // Encola para reintento
  }
}
```

## 🔧 Beneficios Clave

1. **Experiencia Sin Interrupciones**: Los usuarios pueden trabajar normalmente sin importar la conexión  
2. **Sin Pérdida de Datos**: Todos los cambios se guardan localmente y se sincronizan después  
3. **Retroalimentación Clara**: Indicadores visuales muestran el estado de sincronización en todo momento  
4. **Recuperación Automática**: La app se sincroniza automáticamente al volver la conexión  
5. **Prevención de Conflictos**: La fusión inteligente previene conflictos de datos

## 🎮 Flujo de Experiencia del Usuario

```
Usuario añade tarea sin conexión → La tarea aparece de inmediato → Punto amarillo muestra "pendiente"
                        ↓
Usuario se conecta → Banda azul "Sincronizando..." → La tarea recibe ID del servidor
                        ↓
Sincronización completa → Banda verde "Todo sincronizado" → Punto verde indica "sincronizado"
```

## 📁 Estructura de Archivos

```
src/
├── composables/
│   ├── useNetwork.ts          # Detección del estado de red
│   ├── useTasks.ts            # Gestión de tareas y lógica de sincronización
│   ├── useAuth.ts             # Manejo de autenticación
│   └── useSync.ts             # Gestión del estado de sincronización
├── services/
│   └── api.ts                 # Llamadas API al servidor
├── utils/
│   ├── storage.ts             # Operaciones de almacenamiento local
│   └── taskConverter.ts       # Conversión de formatos de datos
├── components/
│   ├── SyncStatusBar.vue      # Indicador de estado de sincronización
│   ├── NetworkStatus.vue      # Indicador de estado de red
│   └── TaskCard.vue           # Tarea individual con puntos de sincronización
└── types/
    └── index.ts               # Definiciones de TypeScript
```

## 🚀 Detalles Técnicos de la Implementación

### **Arquitectura del Flujo de Datos**
1. **Acción del Usuario** → Actualización del Estado Local → Guardado en Almacenamiento Local  
2. **Si Está en Línea** → Llamada a API → Actualización con respuesta del servidor  
3. **Si Está Sin Conexión** → Encolar para Sincronización → Mostrar Estado Pendiente  
4. **Al Reconectarse** → Procesar Cola de Sincronización → Actualizar Interfaz

### **Estructura de la Cola de Sincronización**
```typescript
interface SyncItem {
  localId: string              // Identificador local de la tarea
  task: Task                   // Datos completos de la tarea
  operation: "create" | "update" | "delete"  // Qué operación realizar
  timestamp: number            // Cuándo fue encolada
}
```

### **Gestión de Estado**
- **Reactividad de Vue**: Actualizaciones de interfaz en tiempo real  
- **Composables**: Lógica reutilizable entre componentes  
- **Inyección de Contexto**: Estado compartido sin necesidad de props  
- **Watchers**: Activación automática de sincronización

Esta implementación garantiza que los usuarios nunca pierdan su trabajo y siempre conozcan el estado de sus datos, creando una experiencia fiable y transparente enfocada en el modo offline. 🚀

[Volver](README.md)

# Arquitectura de Sincronización - Vue PWA Task Manager - Nestjs - Mongodb

```mermaid
graph TB
    subgraph "Vue PWA Frontend"
        A[Usuario Interactúa] --> B{¿Online?}
        
        subgraph "Modo Online"
            B -->|Sí| C[API Request]
            C --> D[Headers: Bearer JWT]
            D --> E[Axios/Fetch]
        end
        
        subgraph "Modo Offline"  
            B -->|No| F[Guardar en localStorage]
            F --> G[Encolar en pendingSync]
            G --> H[Mostrar indicador amarillo]
        end
        
        subgraph "Detección de Red"
            I[useNetwork.ts] --> J[navigator.onLine]
            J --> K{¿Conexión restaurada?}
            K -->|Sí| L[syncTasksWithAPI]
            L --> M[Procesar cola pendingSync]
        end
        
        subgraph "Almacenamiento Local"
            N[localStorage]
            O[TASKS_KEY]
            P[PENDING_SYNC_KEY]
            Q[SyncItem: localId, task, operation, timestamp]
        end
        
        subgraph "Componentes UI"
            R[TaskCard.vue]
            S[SyncStatusBar.vue]
            T[Indicadores de estado por color]
        end
    end
    
    subgraph "Backend NestJS"
        U[JWT Guard] --> V{¿Token válido?}
        
        subgraph "Endpoints"
            W[POST /users/register]
            X[POST /users/login]
            Y[GET /tasks]
            Z[POST /tasks]
            AA[PATCH /tasks/:id]
            BB[DELETE /tasks/:id]
            CC[GET /tasks/:id]
        end
        
        subgraph "Servicios"
            DD[TaskService]
            EE[UserService]
        end
        
        FF[Base de Datos]
    end
    
    %% Conexiones principales
    E --> U
    U --> V
    V -->|Sí| Y
    V -->|Sí| Z
    V -->|Sí| AA
    V -->|Sí| BB
    V -->|Sí| CC
    V -->|No| GG[401 Unauthorized]
    
    Y --> DD
    Z --> DD
    AA --> DD
    BB --> DD
    CC --> DD
    
    W --> EE
    X --> EE
    
    DD --> FF
    EE --> FF
    
    %% Flujo de sincronización
    M --> E
    F --> N
    G --> N
    
    %% Manejo de errores
    GG --> HH[handleUnauthorized]
    HH --> II[Logout]
    
    %% Indicadores visuales
    H --> T
    L --> JJ[Indicador azul: Sincronizando]
    JJ --> KK[Indicador verde: Completado]
    
    %% Estilos
    classDef frontend fill:#42b883,stroke:#333,stroke-width:2px,color:#fff
    classDef backend fill:#e0234e,stroke:#333,stroke-width:2px,color:#fff  
    classDef database fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    classDef storage fill:#ff9500,stroke:#333,stroke-width:2px,color:#fff
    
    class A,B,C,D,E,F,G,H,I,J,K,L,M,R,S,T frontend
    class U,V,W,X,Y,Z,AA,BB,CC,DD,EE backend
    class FF database
    class N,O,P,Q storage
    
