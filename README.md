# Inventory Management Telegram Bot

This is a Telegram bot for managing inventory items and projects. The bot allows users to log in, add items to the inventory, create projects, and manage the available items. It also includes functionalities like searching, editing, and deleting items from the inventory and projects.

## Features

- **User Authentication**: Users need to log in with a username and password.
- **Inventory Management**:
  - Add items to the inventory.
  - View the available inventory.
  - Edit or delete items based on their ID.
  - Check item availability by name.
- **Project Management**:
  - Create projects and assign items from the inventory.
  - List all projects and manage them.
- **Search**:
  - Search for items based on name, project, or date.
- **Logout Functionality**: Users can log out, and they need to log back in to use the bot.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Commands](#available-commands)
- [Contribution](#contribution)

## Installation

### Prerequisites

1. Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed.
2. Create a bot on [Telegram](https://core.telegram.org/bots) and get the `BOT_TOKEN`.

### Steps

1. Clone the repository:
    ```bash
    git clone https://github.com/your-repository.git
    cd your-repository
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Set up your `.env` file with the following variables:
    ```bash
    BOT_TOKEN=your-telegram-bot-token
    MONGODB_URI=your-mongodb-connection-string
    PORT=3000
    ```

4. Start the bot:
    ```bash
    node bot.js
    ```

## Configuration

In the `.env` file, set the following configurations:

- `BOT_TOKEN`: Telegram bot token.
- `MONGODB_URI`: MongoDB connection URI.
- `PORT`: The port where the bot server will run (default is `3000`).

## Usage

### How to Log In

When you start the bot, it will ask you to log in with your username and password. After successful authentication, you will see the main menu with options like:

- Add item to inventory
- Create project
- View inventory
- List projects
- Edit/Delete items and projects
- Search and more...

### Available Commands

Once logged in, you will have access to the following commands:

- **Add item to inventory**:
    - You can add a new item by entering the product ID, model, and quantity.
  
- **Create project**:
    - Assign inventory items to a new project and set start/end dates.

- **View inventory**:
    - Display a list of all available inventory items with their details.

- **List projects**:
    - View all the projects and their assigned items.

- **Edit/Delete items by ID**:
    - Edit or delete an item from the inventory based on its unique ID.

- **Check item by name**:
    - Get the quantity available for a specific item by searching its name.

- **Search**:
    - Search for items based on name, project, or date.

- **Logout**:
    - Log out from the current session.

## Contribution

Feel free to contribute to this project by creating a fork, making enhancements, and submitting a pull request.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add some feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.


