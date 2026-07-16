# Defined by Dwija

Premium bridal makeup and hairstyling website for Defined by Dwija, a Burnaby-based bridal beauty brand serving Vancouver, Burnaby, Surrey, Greater Vancouver, destination weddings, and South Asian bridal clients.

## Pages

- Home
- About
- Portfolio
- Services
- Reviews
- Inquiry

## Local Preview

Run the local Node server from this folder:

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:5501/index.html
```

Use this server for local inquiry form testing. A static server such as VS Code Live Server or
`python -m http.server` can show the pages, but it cannot execute `api/inquiry.js`, so POST
requests to `/api/inquiry` will fail.
