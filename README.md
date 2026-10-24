# Forma Employee Management

A React employee management application demonstrating Create, Read, Update, and Delete (CRUD) operations, reusable components, props, events, conditional and list rendering, and controlled forms.

## API integration

The directory loads employees from the [DummyJSON Users API](https://dummyjson.com/docs/users). Adding an employee sends a `POST`; editing or deleting an employee loaded from the API sends a `PUT` or `DELETE`. DummyJSON simulates writes and does not persist them. Newly added records therefore use local edits and deletes after creation, and reloading restores the API's original employee data.

## Run locally

```sh
npm install
npm run dev
```

## Validate

```sh
npm run lint
npm run build
```
