# Copy-paste prompt — Staff portal polish (run until done)

Paste everything below into a **new Agent chat** (Construvasco frontend workspace):

---

**Tarefa:** Polish visual completo da área staff (admin, gestor, técnico) no Construvasco.

**Instruções obrigatórias:**
1. Lê e segue a skill do projeto: `.cursor/skills/polish-staff-portal/SKILL.md`
2. Usa o checklist: `.cursor/skills/polish-staff-portal/CHECKLIST.md` — marca cada item `[x]` ao concluir
3. **Não pares** até o último item do checklist estar `[x]` e o build passar
4. Replica a qualidade do portal cliente (`req-*`, `prj-*`, `dash-*`, `set-*`, tokens `--app-*`)
5. Prefixo staff: `stf-*` por ecrã (`stf-dash-*`, `stf-req-*`, etc.)
6. Ordem: Phase A (admin, todos os menus) → Phase B (QA gestor) → Phase C (QA técnico)
7. `npm run build` após cada ecrã; corrige erros antes de avançar
8. Não commits unless I ask

**Logins demo:**
- admin@construvasco.co.mz / Admin@2026
- gestor@construvasco.co.mz / Gestor@2026
- tecnico@construvasco.co.mz / Tecnico@2026

**URL base:** http://127.0.0.1:4200/#/admin/

Começa agora pelo **A1 Painel** (`admin-dashboard`) e continua sequencialmente sem pedir confirmação entre menus.

---

## Variante curta

```
@polish-staff-portal Executa Phase A→C do CHECKLIST.md sem parar até tudo [x]. Build após cada ecrã. Começa em A1 Painel.
```
