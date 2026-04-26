# NutriFlow – Clinical Diet & Enteral Feeding Calculator

NutriFlow is a **frontend web application** that automates **clinical nutrition calculations** including Ideal Body Weight (IBW), Resting Energy Expenditure (REE), and enteral feeding prescriptions using **validated clinical formulas**.

The project is designed to simulate **real hospital nutrition workflows** with a strong focus on **accuracy, usability, and clean UI logic**.

---

## 🚀 Key Features

* **IBW Calculation**
  Hamwi, Devine, and Robinson methods

* **REE Calculation**
  Harris-Benedict, WHO, Owen, Mifflin-St Jeor, and Liu equations

* **Protein Requirement Estimation**
  Adjustable based on clinical goals

* **Enteral Product Database**
  12 products with detailed nutritional specifications

* **Smart Filtering**
  Filter by sodium content, caloric density, and protein levels

* **Dilution & Volume Calculator**
  Half, standard, and double concentration options

* **Prescription Output**
  Nursing-ready diet prescription summary

---

## 🧠 Why This Project

Clinical nutrition calculations are often done **manually or using spreadsheets**, which is time-consuming and error-prone.
NutriFlow demonstrates how **frontend logic and structured JavaScript** can be used to automate healthcare workflows reliably.

This project focuses on:

* Translating **domain logic into code**
* Clean separation of **UI, data, and calculations**
* Building **production-style frontend applications** without frameworks

---

## 🛠️ Tech Stack

* **HTML5** – Semantic structure
* **CSS3** – Responsive layout using Flexbox & Grid
* **JavaScript (Vanilla)** – Modular logic and state handling

No backend or external libraries required.

---

## 📁 Project Structure

```
nutriflow/
├── index.html          # Application UI
├── styles.css          # Styling & responsive design
├── data.js             # Enteral product data & constants
├── calculations.js    # Clinical calculation logic
├── ui.js               # DOM rendering & interactions
├── app.js              # Application state & orchestration
├── medical-symbol.png  # Visual asset
└── README.md
```

---

## 🧩 Architecture Overview

* **data.js**
  Contains immutable nutrition product data and thresholds

* **calculations.js**
  Pure functions for IBW, REE, protein, and dilution calculations

* **ui.js**
  Handles DOM updates, rendering, and user interactions

* **app.js**
  Central application state and event coordination

This structure ensures **clear separation of concerns** and easy maintainability.

---

## ♿ Accessibility & UX

* Semantic HTML and labeled form inputs
* Keyboard-accessible interactions
* WCAG-compliant color contrast
* Mobile-friendly and touch-optimized UI
* Print-friendly prescription layout

---

## 📦 Running Locally

No setup required.

```bash
git clone https://github.com/hemanthscode/nutriflow.git
cd nutriflow
```

Open `index.html` in your browser.

---

## 📈 Future Enhancements

Planned improvements:

* PDF export for prescriptions
* Local storage for patient sessions
* Dark mode
* Offline support
* Multi-language support
* Backend integration for persistence

---

## ⚠️ Medical Disclaimer

This tool is intended for **educational and demonstration purposes**.
Clinical decisions should always be verified against official medical guidelines.

---

## 📄 License

MIT License

---

## 👤 Maintained By

**Hemanth S**
MCA Student | Frontend & Python-focused Developer