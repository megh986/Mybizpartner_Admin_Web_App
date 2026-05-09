# Image Upload Frontend

A React TypeScript application for uploadingr productr images with companty anrd product select.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- **Login Page**: Fixed credentials authentication (username: `admin`, password: `admin123`)
- **Company Selectidon**: Fetch and display all companies from database
- **Product Selection**: Dynamically fetch products based on selected company
- **Multiple Image Upload**: Select and upload multiple images at once
- **Image Preview**: Preview selected images before upload
- **Upload Results**: Display assigned review indices and image IDs after successful upload

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on `http://localhost:8000`

## Installation

Navigate to the project directory and install dependencies:
```bash
cd image-upload-frontend
npm install
```

## Usage

### Step 1: Login
- Use the fixed credentials:
  - **Username**: `admin`
  - **Password**: `admin123`

### Step 2: Select Company
- Choose a company from the dropdown
- The dropdown will display all companies from the database

### Step 3: Select Product
- After selecting a company, the product dropdown will populate
- Choose a product for which you want to upload images

### Step 4: Upload Images
- Click "Choose Files" to select multiple images
- You can preview selected images and remove any if needed
- Click "Upload Images" to start the upload process

### Step 5: View Results
- After successful upload, you'll see:
  - Total number of images uploaded
  - Number of images assigned to reviews
  - **Review indices**: List of review array indices where images were assigned
  - **Image IDs**: MongoDB Object IDs of uploaded images

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `GET /api/image/all-companies` - Fetch all companies
- `GET /api/image/products/{company_id}` - Fetch products by company
- `POST /api/image/upload-images` - Upload images with company_id and product_id

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
