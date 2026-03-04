# LearnAtHome

LearnAtHome est une application web de mise en relation entre **tuteurs** et **élèves**, permettant de gérer les cours à domicile de façon centralisée.

## Fonctionnalités

- **Authentification** — inscription (rôle tuteur ou élève), connexion, réinitialisation du mot de passe
- **Tableau de bord** — vue d'ensemble personnalisée selon le rôle
- **Messagerie** — conversations en temps réel entre tuteur et élèves ; envoi, lecture et suppression de messages
- **Tâches** — création, modification, suppression et marquage comme terminées des tâches assignées
- **Calendrier / Événements** — planification de sessions avec participants, affichage mensuel
- **Contacts par invitation** — envoi d'une invitation par e-mail à un contact externe. Validation via un lien unique

## Stack technique

- **Frontend** : Angular 17 (standalone components)
- **Backend / BDD** : Firebase (Authentication + Firestore)
- **E-mails** : EmailJS (invitations de contact)
- **Tests** : Jest + jest-preset-angular

---

## Installation et démarrage

### Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- [Angular CLI](https://angular.io/cli) : `npm install -g @angular/cli`
- Un compte [Firebase](https://firebase.google.com/) (c'est gratuit)
- Un compte [EmailJS](https://www.emailjs.com/) (c'est gratuit)

### 1. Cloner le dépôt

```bash
git clone https://github.com/<votre-username>/learnAtHome.git
cd learnAtHome
npm install
```

### 2. Configurer Firebase

1. Rendez-vous sur [console.firebase.google.com](https://console.firebase.google.com/) et créez un nouveau projet.
2. Dans le projet, activez les deux services suivants :
   - **Authentication** → onglet *Sign-in method* → activer **Email/Mot de passe**
   - **Firestore Database** → créer une base en mode *test* (ou configurez vos règles de sécurité), sélectionner *eur3 (europe-west)*
3. Dans *Paramètres du projet (Général) > Vos applications*, ajoutez une application **Web** et copiez le bloc (`firebaseConfig`).

### 3. Configurer EmailJS

EmailJS permet d'envoyer les e-mails d'invitation sans back-end.

1. Créez un compte sur [emailjs.com](https://www.emailjs.com/).
2. Dans *Email Services*, connectez votre fournisseur e-mail (Gmail, Outlook, etc.) et notez le **Service ID**.
3. Dans *Email Templates*, créez un template contenant au minimum les variables suivantes et notez le **Template ID** :
   - `{{from_name}}` — nom de l'expéditeur
   - `{{to_email}}` — adresse du destinataire
   - `{{validation_link}}` — lien de validation du contact
4. Dans *Account > API Keys*, copiez votre **Public Key**.

### 4. Renseigner les variables d'environnement

Ouvrez `src/environments/environment.ts` et remplacez les valeurs fictives par vos propres clés :

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'VOTRE_API_KEY',
    authDomain: 'VOTRE_PROJECT_ID.firebaseapp.com',
    projectId: 'VOTRE_PROJECT_ID',
    storageBucket: 'VOTRE_PROJECT_ID.appspot.com',
    messagingSenderId: 'VOTRE_MESSAGING_SENDER_ID',
    appId: 'VOTRE_APP_ID'
  },
  emailjs: {
    serviceId: 'VOTRE_SERVICE_ID',
    templateId: 'VOTRE_TEMPLATE_ID',
    publicKey: 'VOTRE_PUBLIC_KEY'
  }
};
```

### 5. Lancer l'application

```bash
npm start
```

L'application est disponible sur [http://localhost:4200](http://localhost:4200).

### 6. Lancer les tests

```bash
npm test
```

## Build de production

```bash
npm run build
```