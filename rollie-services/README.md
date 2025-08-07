# 🧾 HelloAbu API

Welcome to the official documentation of the **HelloAbu Admin & User API** — a modern, scalable backend for managing users, watches, plans (tiers), documents, and more.

This backend is built using **Spring Boot** with **Reactor (WebFlux)** for reactive programming, and it follows RESTful design principles to ensure seamless integration across all platforms.

---

## 📦 Features

* 🔐 **Authentication:** Secure JWT-based login and registration flows
* 👥 **Admin User Management:** Get, update, and deactivate users
* 📄 **Document Upload & Parsing:** Excel file ingestion from column A
* 💎 **Tier/Plan Management:** Define features, prices, and access levels
* ❤️ **User Favorites:** Add or remove watch references
* 🧑‍💼 **Account Upgrades & Profile Management**
* ⌚ **Watch Search & Info:** Search by price, reference, condition, etc.

---

## 🚀 Quick Start

### Base URL

```
https://your-domain.com/api
```

> All endpoints return a unified response:

```json
{
  "data": ...,
  "status": "success",
  "timestamp": "2025-07-18T12:34:56.789Z"
}
```

### Authorization

Some routes require Bearer Token (JWT):

```
Authorization: Bearer <your_token>
```

---

## 📚 Endpoints

*Navigate through the following sections for detailed endpoint documentation:*

* [Authentication (`/auth`)](#-authentication-endpoints)
* [Admin Users (`/admin`)](#-admin-user-management)
* [Document Management (`/admin/documents`)](#-document-management)
* [Tiers / Plans (`/tiers`)](#-tiers-plans-management)
* [Favorites (`/favorites`)](#-favorites)
* [Account (`/account`)](#-account-features)
* [Watches (`/watches`)](#-watches)

---

{{rest of the original documentation continues below\...}}


# 📚 API Documentation

This document provides a comprehensive overview of the backend API services for an admin and user-facing application, including endpoints, request/response formats, and use-case demos.

---

## 🔐 Authentication Endpoints

### `POST /auth/login`

Authenticate a user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword"
}
```

**Response:**

```json
{
  "user": { ... },
  "token": "JWT_TOKEN"
}
```

### `POST /auth/register`

Register a new user.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "securePass",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+123456789"
}
```

### `POST /auth/verify-reset`

Verify identity before password reset.

**Request Body:**

```json
{
  "email": "user@example.com",
  "phoneNumber": "+123456789"
}
```

### `PUT /auth/{userId}/reset-password`

Reset user password.

**Request Body:**

```json
{
  "newPassword": "newSecurePass"
}
```

---

## 👤 Admin User Management

### `GET /admin/{userId}`

Get user by ID.

### `GET /admin/users?page=0&limit=10`

Paginated list of users.

### `PUT /admin/{userId}`

Update user profile.

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "new@example.com",
  "role": "USER",
  "phoneNumber": "+123456789"
}
```

### `POST /admin/{userId}/deactivate`

Deactivate a user.

---

## 📄 Document Management

### `POST /admin/documents/upload`

Upload and parse Excel document (column A only).

**Form Data:**

```
file: (binary Excel file)
```

### `GET /admin/documents/count`

Get count of active documents.

### `GET /admin/documents/recent?limit=4`

Get recent document entries.

---

## 💎 Tiers (Plans) Management

### `POST /tiers`

Create a new plan.

**Request Body:**

```json
{
  "name": "Premium",
  "description": "Access to all features",
  "price": 29.99,
  "active": true,
  "searchLimit": 100,
  "advancedSearch": true,
  "extraProperties": ["priceGraph", "notifications"]
}
```

### `GET /tiers`

Get all tiers.

### `PUT /tiers/{id}`

Update a tier.

### `DELETE /tiers/{id}`

Delete a tier.

### `PATCH /tiers/{id}/deactivate`

Deactivate a tier.

### `PATCH /tiers/{id}/activate`

Activate a tier.

---

## ❤️ Favorites

### `GET /favorites/{userId}`

List user's favorite references.

### `PUT /favorites/{userId}/add`

Add a favorite.

**Request Body:**

```json
{
  "reference": "126300"
}
```

### `PUT /favorites/{userId}/remove`

Remove a favorite.

**Request Body:**

```json
{
  "reference": "126300"
}
```

---

## 🛠️ Account Features

### `PUT /account/upgrade?planId=2`

Upgrade plan (requires Bearer Token).

### `PUT /account/{userId}/profile`

Update user profile.

**Request Body:**

```json
{
  "firstName": "Alice",
  "lastName": "Wonder",
  "phoneNumber": "+111111111"
}
```

---

## ⌚ Watches

### `GET /watches/{reference}`

Fetch watch by reference.

### `POST /watches/search`

Search watches by criteria.

**Request Body:**

```json
{
  "referenceCode": "126300",
  "colorDial": "green",
  "year": 2024,
  "condition": "new",
  "minPrice": 5000,
  "maxPrice": 15000
}
```

### `POST /watches/by-references`

Get watches from a list of references.

**Request Body:**

```json
{
  "references": ["126300", "114060"]
}
```

### `GET /watches/price-range?min=10000&max=50000`

Find watches in price range.

### `GET /watches/price-history?reference=126300`

Get 5-day price history.

### `GET /watches/autocomplete?prefix=126`

Autocomplete references by prefix.

---

## 🔧 Utilities

All endpoints return the following structure:

```json
{
  "data": <actual response>,
  "status": "success",
  "timestamp": "ISO_8601_DATE"
}
```

---

For authorization, include JWT tokens in `Authorization: Bearer <token>` headers where applicable.
