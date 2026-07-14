<div align="center">
    <div id="user-content-toc">
      <ul>
        <summary><h1 style="display: inline-block; margin-bottom:0px">ericxie.com</h1></summary>
      </ul>
    </div>
    <h3>Personal Website</h3>
    <br>
    <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white"/>
    <img src="https://img.shields.io/badge/Typescript-%2320232a.svg?style=for-the-badge&logo=typescript&logoColor=blue"/>
    <img src="https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue"/>
    <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
    <img src="https://img.shields.io/badge/Vercel-000000.svg?style=for-the-badge&logo=Vercel&logoColor=white"/>
    <br><br>
</div>

<img width="1488" alt="Screenshot 2024-05-04 at 9 58 56 PM" src="https://github.com/ericcxie/ericxie.com/assets/66566975/be7e3e8d-e49e-42e9-bf3a-3c3e6ab06eae">

## Getting Started

_(localhost:3000 by default)_

1. `npm install`
1. `npm run dev`

### Setting up Mapbox

_To get started, please create a Mapbox account and copy your access token_

1. `touch .env`

Add the following in the `.env` file and replace with your access token

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
```

### Running Image Optimization Script

_This script converts all images in the public folder to WebP format for optimization purposes_

#### Prerequisites

1. `python3 -m venv .venv`
1. `source .venv/bin/activate`
1. `pip install -r scripts/requirements.txt`

#### Run the script

`python3 scripts/convert_to_webp.py`

[![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/design/viQidOk1Ohujendju5nR74/Personal-Website-2.0?node-id=0-1&t=yC1RJkEj4UPZuQ95-1)
