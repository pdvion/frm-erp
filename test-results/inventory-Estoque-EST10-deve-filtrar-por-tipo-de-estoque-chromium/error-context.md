# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]:
        - generic [ref=e7]: FRM
      - heading "FRM ERP" [level=1] [ref=e8]
      - paragraph [ref=e9]: Sistema de Gestão Industrial
    - generic [ref=e10]:
      - heading "Entrar" [level=2] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: E-mail
          - generic [ref=e15]:
            - img [ref=e16]
            - textbox "E-mail" [ref=e19]:
              - /placeholder: seu@email.com
        - generic [ref=e20]:
          - generic [ref=e21]: Senha
          - generic [ref=e22]:
            - img [ref=e23]
            - textbox "Senha" [ref=e26]:
              - /placeholder: ••••••••
        - button "Entrar" [ref=e27]:
          - img [ref=e28]
          - text: Entrar
        - link "Esqueci minha senha" [ref=e32] [cursor=pointer]:
          - /url: /forgot-password
    - paragraph [ref=e33]: © 2026 FRM ERP - Grupo FRM
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
  - alert [ref=e43]
```