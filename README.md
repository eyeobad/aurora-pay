# 💸 Aurora Pay – E-Wallet Demo App

Aurora Pay is a **modern, cross-platform e-wallet demo app** built with **React Native and Expo**.  
It provides users with a sleek and realistic experience of digital wallet operations — including registration, login, balance top-up, money transfer, and transaction history — all in a visually appealing, mobile-first interface.

---

## 🚀 Features

- 🔐 **User Authentication** – Register and log in with mock credentials.  
- 💰 **Top-Up Balance** – Add virtual funds to your wallet for demo purposes.  
- 💸 **Send Money** – Transfer mock amounts and watch your balance update instantly.  
- 📜 **Transaction History** – View all sent and received transactions dynamically.  
- 🧾 **Real-Time State Updates** – All wallet data, balance, and history sync instantly using the Context API.  
- 🎨 **Modern UI/UX** – Inspired by real fintech dashboards with custom components, smooth layout, and clean design.  
- ⚡ **Fully Responsive** – Works seamlessly on both Android and iOS devices via Expo Go.

---

## 🧠 Technologies Used

| Layer | Technology |
|-------|-------------|
| **Frontend Framework** | React Native (with Expo SDK) |
| **State Management** | React Context API |
| **Navigation** | React Navigation (Stack + Bottom Tabs) |
| **Styling** | Custom reusable components + modern design system |
| **Development Platform** | Expo, GitHub Codespaces |

---

## 🧩 Folder Structure

src/
┣ components/ # Reusable UI components
┣ screens/ # App screens (Home, Wallet, Send, History, etc.)
┣ context/ # Global AppContext (balance, transactions, etc.)
┣ assets/ # Images, icons, and fonts
┗ lib/ # Storage


---

## 🛠️ Setup & Installation

Follow these steps to run the Aurora Pay demo app on your device:

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/aurora-pay.git
cd aurora-pay

#Install dependencies
npm install

#Install Expo Go App

Go to Play Store (Android) or App Store (iOS)

Search for Expo Go and install it on your device.

#Start the Development Server

#If running locally:

npx expo start

#If using GitHub Codespaces or remote environments:

npx expo start --tunnel


#Open the App on Your Device

After running the command above, a QR code will appear in your terminal or Expo dashboard.

Open the Expo Go app → tap Scan QR Code → and scan the code to launch Aurora Pay on your device.

#🧭 App Navigation Guide

| Section                 |    Description                                                           | -----------------------   | ---------------------------------------------------------------------------------------------------- |
| **Register / Sign Up**  | Create a demo account using mock details.                                                            |
| **Login**               | Access your demo wallet. (No backend authentication required — credentials are simulated.)           |
| **Home Screen**         | Displays your balance, and quick links to wallet actions.                                      |
| **Wallet Screen**       | Shows your current balance and options to **Top Up** or **Send Money**.                              |
| **Top-Up Screen**       | Add mock funds to your account to simulate wallet loading.                                           |
| **Send Money Screen**   | Enter a recipient name and amount to send — your balance and transaction list will update instantly. |
| **Transaction History** | Displays a list of recent top-ups and transfers with timestamps and details.                         |


#💡 Demo Notes

The balance and transaction updates are mocked but stateful using the React Context API.

No real money is processed — this is a demo app purely for presentation purposes.

All changes persist device even after app reloads (simulating real backend intergration).


#🧑‍💻 Developer Info

Author: Paschal Okafor
Stack: Full Stack Developer (React Native, React.js, Node.js, Express, MongoDB, Python, e.t.c)
Project Type: Test / Demo E-Wallet App
Platform: Expo + React Native

#🪄 Future Enhancements

✅ Integration with a real backend (Node.js + MongoDB)

✅ Push notifications for transactions

✅ Secure authentication (JWT / Firebase Auth)

✅ Real-time transaction updates via Socket.io

✅ Light/Dark mode support

#⚠️ Disclaimer: Aurora Pay is a demo app created for learning and showcase purposes. It does not perform real financial transactions.

#💖 Thank You for Exploring Aurora Pay!