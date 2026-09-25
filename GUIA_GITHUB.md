# Guía para subir LABSEMCO a GitHub

El proyecto ya tiene un historial Git local y usa la rama `main`. No es necesario ejecutar `git init` otra vez.

## 1. Crear el repositorio en GitHub

1. Entra a https://github.com e inicia sesión.
2. Pulsa **New repository**.
3. Escribe un nombre, por ejemplo `labsemco`.
4. Elige **Private** si solamente el equipo debe verlo o **Public** si cualquiera puede consultarlo.
5. No selecciones las opciones para crear README, `.gitignore` o licencia, porque el proyecto ya contiene sus propios archivos.
6. Pulsa **Create repository**.
7. Copia la dirección HTTPS que mostrará GitHub. Tendrá una forma similar a:

```text
https://github.com/USUARIO/labsemco.git
```

## 2. Conectar la carpeta local

Abre PowerShell y ejecuta:

```powershell
cd "C:\Users\arane\Documents\nv. labsemco"
git remote add origin https://github.com/USUARIO/labsemco.git
git push -u origin main
```

Sustituye `USUARIO` y la dirección completa por los datos que GitHub te proporcione. Durante el primer envío, GitHub puede abrir el navegador para solicitar autorización.

## 3. Verificar la conexión

```powershell
git remote -v
git status
```

Después, actualiza la página del repositorio en GitHub y confirma que aparezcan los archivos del sitio.

## 4. Subir cambios futuros

Cada vez que modifiques la página:

```powershell
cd "C:\Users\arane\Documents\nv. labsemco"
git status
git add .
git commit -m "Describe brevemente el cambio"
git push
```

Ejemplo:

```powershell
git commit -m "Actualizar integrantes y proyectos"
```

## Si aparece que `origin` ya existe

No vuelvas a agregarlo. Actualiza su dirección:

```powershell
git remote set-url origin https://github.com/USUARIO/labsemco.git
git push -u origin main
```

## Recomendaciones

- Revisa `git status` antes de cada envío.
- No borres la carpeta oculta `.git`.
- No publiques contraseñas, llaves privadas ni archivos con credenciales.
- Usa mensajes de versión que expliquen el cambio realizado.
- Si el repositorio es privado, agrega colaboradores desde **Settings → Collaborators** en GitHub.
