# Deploy da landing raiz (inosaas.com.br) no GitHub Pages

Publica a landing mínima em `https://inosaas.com.br` para o Google AdSense
verificar o domínio raiz (o RepFit fica em `repfit.inosaas.com.br`).

## 1. Criar o repositório

```bash
cd landing-raiz
git init
git add .
git commit -m "feat: landing raiz inosaas.com.br para verificação AdSense"
```

Crie um repositório novo no GitHub (ex.: `inosaas-landing`) e:

```bash
git remote add origin https://github.com/SEU-USUARIO/inosaas-landing.git
git push -u origin main
```

## 2. Ativar o GitHub Pages

No repositório novo: **Settings → Pages → Build and deployment**
- Source: **GitHub Actions**

Ou, mais simples: Source: **Deploy from a branch** → branch `main`, pasta `/ (root)`.

## 3. Ativar o domínio customizado

Ainda em **Settings → Pages → Custom domain**, digite:

```
inosaas.com.br
```

Marque **"Enforce HTTPS"** depois que o certificado ficar pronto (pode levar
alguns minutos).

## 4. Configurar o DNS no provedor do domínio

No painel do Registro.br (ou onde o domínio está hospedado), aponte a raiz
para o GitHub Pages:

| Tipo  | Nome | Valor                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |

CNAME para `www` é opcional (recomendado):

| Tipo  | Nome | Valor                    |
|-------|------|--------------------------|
| CNAME | www  | SEU-USUARIO.github.io    |

A propagação pode levar de 10 minutos a algumas horas.

## 5. Verificar

Depois de propagar, confirme:

- `https://inosaas.com.br/` → abre a landing
- `https://inosaas.com.br/ads.txt` → `google.com, pub-9155959825288070, DIRECT, f08c47fec0942fa0`
- No AdSense: Sites → `inosaas.com.br` → "Solicitar revisão" novamente.

Pronto — o domínio raiz fica verificado e o RepFit (subdomínio) já está com
o código de anúncios instalado.
