# Mode switcher, role picker and mock sign-in (default for every pass)

Every concept pass lets a reviewer see the product as each kind of user, signed out or signed in,
and in each role, without a backend. It has three parts that share one state:

1. **Mode switcher**: a small review control (default bottom-right) listing the modes.
2. **Role picker**: inside the switcher, a role select for each signed-in mode that has more than one
   role.
3. **Mock sign-in and sign-out**: the pass's own sign-in, sign-up and sign-out controls work, so a
   reviewer can also test the normal way, starting signed out.

Skip all three only when the README spec says "Single mode: no switcher".

## Where modes and roles come from

The orchestrator writes a "Modes, Roles and Mock Sign-in" table into the README spec, worked out from
the project's planning files (actors in user stories, personas, PRD roles, auth docs). Build exactly
those modes and roles, with their ids and labels. Do not invent modes the table does not list.

Example from a dealership app (the user's own example):

| Mode id | Mode | Signed in | Entry view | Roles (default first) |
|---|---|---|---|---|
| `prospect` | Prospect (our marketing site) | no | `index.html` | none |
| `dealer-out` | Dealer signed out | no | `app-signin.html` | none |
| `dealer` | Dealer signed in | yes | `app-home.html` | Owner, Manager, Salesperson, Detailer, Photographer |
| `shopper-out` | Shopper signed out | no | `dealer-home.html` | none |
| `shopper` | Shopper signed in | yes | `dealer-account.html` | none |
| `admin` | Platform admin | yes | `admin-dealers.html` | none |

Picking "Dealer signed in" then "Detailer" shows what a detailer sees: their detail jobs first, no
car costs or profit, no billing. "Owner" sees money and settings. "Photographer" lands on the photo
queue. Each role can name its own home view.

## Behavior

- **First visit is signed out.** With no saved state and no URL parameters, the pass starts in the
  first mode of the table (normally the signed-out public visitor).
- **Normal sign-in works.** A sign-in or sign-up form marked `data-mock-signin="<mode-id>"` accepts any
  input that passes its own `required` checks, signs in as that mode's default role, and goes to the
  `next` view if one was given, otherwise to the mode's entry view (or the role's home). Show a small
  hint on the form, for example "Mock sign-in: any details work".
- **Normal sign-out works.** Any control marked `data-mock-signout` signs out to the mode's signed-out
  counterpart (Dealer signed in goes to Dealer signed out) and opens that mode's entry view.
- **Guards.** A view only for some modes says so on `<body data-view-modes="dealer">`. Opened in
  another mode, it sends the visitor to that mode's sign-in view with `?next=<this view>`. A view only
  for some roles says so with `data-view-roles="owner manager"`; another role goes to its home view. A
  sign-in view marks `data-signin-for="dealer"` and forwards an already signed-in visitor to the entry
  view.
- **Start in any state.** `?mode=<mode-id>&role=<role-id>` on any view starts there in that state and
  saves it. A test can start signed out (`?mode=prospect`) or already signed in
  (`app-board.html?mode=dealer&role=detailer`).
- **Switching.** Picking a mode in the switcher sets the state and opens that mode's entry view.
  Changing the role re-renders the current view when the role may see it, otherwise opens the role's
  home view. A "Start over" control (`data-mode-reset`) clears the saved state and returns to the
  first visit.
- **One state.** The switcher, the forms, the guards and the URL parameters all read and write the
  same state, so the switcher always shows the truth after a normal sign-in or sign-out.
- **Inside a view.** Elements only for some modes or roles carry `data-modes="dealer admin"` or
  `data-roles="owner manager"` and are hidden for everyone else (for example the cost column for a
  Detailer).

## Look and placement

- Styled from the pass's own tokens, but clearly a review tool and not part of the product: a small
  pill labeled "Mode" that shows the current mode and role in short form (for example
  "Dealer: Detailer"), with a dashed outline or a small "Review" tag.
- It must never cover content or a control at any scroll position where that content is meant to be
  used. Reserve room for it (bottom padding on scrolling areas), and if something still sits under
  it, tuck it to a small screen-edge tab.
- Placement by surface:
  - `website`: bottom-right, 16px from the edges, above any sticky footer bar; 44px tall on phones.
  - `mobile-app`: above the bottom tab bar or dock on the right, inside the safe area; never over the
    main action button.
  - `vscode-extension`: a status bar item on the right of the mock status bar ("Mode: Owner").
  - `browser-extension`: a small icon button in the popup header.
- The panel is a compact popover: a radio group of modes, the role select under the selected
  signed-in mode, and "Start over". It closes on Escape, on outside click and after a choice.
- Accessible: a real `<button>` with `aria-expanded` and `aria-controls`, a labeled radio group, a
  labeled `<select>` for roles, focus returns to the button on close, visible focus, 4.5:1 contrast,
  44px targets on touch surfaces.
- It sits outside the uniqueness flags: every pass has one, and it does not count as the pass's
  navigation model.

## Hooks used by the validation script and by tests

| Hook | Meaning |
|---|---|
| `[data-mode-switcher]` | Switcher root (one per view) |
| `[data-mode-switcher-toggle]` | The visible "Mode" button |
| `[data-mode-option="<mode-id>"]` | One option per mode |
| `[data-role-select]` | The role select |
| `[data-mode-reset]` | "Start over" |
| `form[data-mock-signin="<mode-id>"]` | A sign-in or sign-up form for that mode |
| `[data-mock-signout]` | A sign-out control |
| `<html data-mode data-role data-signed-in>` | Current state, kept up to date |
| `window.mockAuth` | `modes`, `state()`, `signIn(modeId, roleId)`, `signOut()`, `reset()` |

Also list the modes in `validation/handoff.json` (see the handoff schema in SKILL.md) so the
validation script can open every mode and role. The script checks that the switcher is on every
view and covers nothing, that each mode and role opens from its URL parameters, that the first
signed-in mode's form signs in and `data-mock-signout` signs out, and saves one screenshot per mode
and role to `validation/modes/`.

## State logic (reuse as written; style the switcher yourself)

The look of the switcher is yours. The state logic below is the contract; reuse it in `app.js`
(replace `MODES` and `STORE_KEY`) and build the switcher UI on top of `window.mockAuth`.

```js
/* ===== Mock sign-in state: shared by the Mode switcher, the forms and the URL ===== */
// MODES comes from the README spec's "Modes, Roles and Mock Sign-in" table.
const MODES = [
  { id: 'prospect', label: 'Prospect', signedIn: false, entry: 'index.html' },
  { id: 'dealer-out', label: 'Dealer signed out', signedIn: false, entry: 'app-signin.html' },
  { id: 'dealer', label: 'Dealer signed in', signedIn: true, entry: 'app-home.html',
    signInView: 'app-signin.html', signedOutMode: 'dealer-out',
    roles: [
      { id: 'owner', label: 'Owner', home: 'app-home.html' },
      { id: 'detailer', label: 'Detailer', home: 'app-jobs.html' },
      { id: 'photographer', label: 'Photographer', home: 'app-photos.html' },
    ] },
];
const STORE_KEY = 'mockAuth:<pass-slug>';
const findMode = (id) => MODES.find((m) => m.id === id);

function normalizeAuth(s) {
  const mode = findMode(s && s.mode) || MODES[0];
  const roles = mode.roles || [];
  const role = roles.find((r) => r.id === (s && s.role)) || roles[0];
  return { mode: mode.id, role: role ? role.id : '', signedIn: Boolean(mode.signedIn) };
}
function loadAuth() {
  const q = new URLSearchParams(location.search);
  if (q.has('mode')) return normalizeAuth({ mode: q.get('mode'), role: q.get('role') });
  try { return normalizeAuth(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (e) { return normalizeAuth(null); }
}
function saveAuth(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* blocked: URL parameters still work */ }
}
let auth = loadAuth();
saveAuth(auth);

function homeFor(s) {
  const mode = findMode(s.mode);
  const role = (mode.roles || []).find((r) => r.id === s.role);
  return (role && role.home) || mode.entry;
}
function safeNext() {
  const next = new URLSearchParams(location.search).get('next') || '';
  return /^[\w.\-/#]+$/.test(next) && !next.startsWith('/') ? next : '';
}
function applyAuth() {
  const root = document.documentElement;
  root.dataset.mode = auth.mode;
  root.dataset.role = auth.role;
  root.dataset.signedIn = String(auth.signedIn);
  document.querySelectorAll('[data-modes]').forEach((el) => { el.hidden = !el.dataset.modes.split(' ').includes(auth.mode); });
  document.querySelectorAll('[data-roles]').forEach((el) => { el.hidden = !el.dataset.roles.split(' ').includes(auth.role); });
  document.dispatchEvent(new CustomEvent('mockauth:change', { detail: { ...auth } }));
}
function setAuth(next) { auth = normalizeAuth(next); saveAuth(auth); applyAuth(); return { ...auth }; }

// Returns false when it sends the visitor somewhere else.
function guardView() {
  const b = document.body.dataset;
  const here = location.pathname.split('/').pop() + location.hash;
  if (b.signinFor && auth.mode === b.signinFor) { location.replace(safeNext() || homeFor(auth)); return false; }
  const modes = (b.viewModes || '').split(' ').filter(Boolean);
  if (modes.length && !modes.includes(auth.mode)) {
    const need = findMode(modes[0]);
    location.replace(need && need.signInView ? need.signInView + '?next=' + encodeURIComponent(here) : MODES[0].entry);
    return false;
  }
  const roles = (b.viewRoles || '').split(' ').filter(Boolean);
  if (roles.length && !roles.includes(auth.role)) { location.replace(homeFor(auth)); return false; }
  return true;
}

window.mockAuth = {
  modes: MODES,
  state: () => ({ ...auth }),
  signIn: (modeId, roleId) => setAuth({ mode: modeId, role: roleId }),
  signOut: () => setAuth({ mode: (findMode(auth.mode) || {}).signedOutMode || MODES[0].id }),
  reset: () => { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } return setAuth(null); },
};

// Normal sign-in and sign-up: <form data-mock-signin="dealer"> with required fields.
document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-mock-signin]');
  if (!form) return;
  ev.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const s = window.mockAuth.signIn(form.dataset.mockSignin);
  location.href = safeNext() || homeFor(s);
});
// Normal sign-out: any element with data-mock-signout.
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-mock-signout]');
  if (!el) return;
  ev.preventDefault();
  location.href = homeFor(window.mockAuth.signOut());
});

function startAuth() { if (guardView()) applyAuth(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAuth);
else startAuth();
```

Notes:
- Build the switcher UI in a `mockauth:change` listener or after `startAuth()`, reading
  `window.mockAuth.state()`; picking a mode calls `signIn` or `setAuth` through `mockAuth` and then
  opens the new state's home view.
- Storage can be blocked in some browsers. The pass must still work for one view at a time through
  the URL parameters.
- Re-render role-dependent parts of a view in a `mockauth:change` listener, so a role change in the
  switcher updates the page without a reload.
