---
title: Getting started with Horizon
image:
excerpt: A starting point to learn about using Horizon in your game
tags: ["basics", "tutorial"]
stability: stable
---

# Getting Started with Horizon Game Server

🚀 **A comprehensive guide to setting up and running your first Horizon game server with plugins.**

Horizon is a high-performance, plugin-driven game server built in Rust that separates core infrastructure from game logic. This guide will walk you through installation, configuration, and creating your first plugin using both manual methods and the Far Beyond CLI tool.

## Prerequisites

Before you begin, you'll need to install Rust and Git. Rust can be installed using rustup by running the following command, then sourcing your environment:

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

You'll also need Git installed, which you can verify with `git --version`. While not required, we highly recommend installing Visual Studio Code with the rust-analyzer extension for the best development experience. Docker is also useful if you plan to deploy using containers.

## Installing the Far Beyond CLI

The easiest way to work with Horizon is using the Far Beyond CLI tool (fbcli), which automates most common tasks. Install it by running `cargo install https://github.com/Far-Beyond-Dev/FB-CLI`. This tool provides commands for repository management, plugin creation, and building that we'll use throughout this guide.

Once installed, you can verify it works by running `fbcli --help` to see all available commands. The CLI handles the complexity of setting up projects correctly and follows best practices automatically.

## Setting Up Horizon

The first step is getting the Horizon server code. You can clone it manually with Git, but the fbcli tool makes this easier:

```bash
# Clone the Horizon repository using fbcli
fbcli repo clone Horizon
cd Horizon

# Or see what other repositories are available
fbcli repo list

# View only public repositories
fbcli repo list --public-only
```

The fbcli repo commands know about all the Far Beyond organization repositories and handle the setup correctly. If you want to manage multiple repositories at once, you can use `fbcli repo update` to update all Far Beyond repositories in your current directory, or `fbcli repo status` to check the git status of all local repositories.

After cloning, navigate into the Horizon directory and examine the structure. Horizon uses a Cargo workspace architecture where the main executable is in `crates/horizon/`, with supporting libraries in `crates/game_server/`, `crates/event_system/`, and `crates/plugin_system/`. The example plugins are in `crates/plugin_greeter/` and `crates/plugin_logger/`.

Understanding this structure is important because it reflects Horizon's modular design. Each crate has a specific responsibility, plugins are isolated from core server code, the event system ensures type safety, and the architecture supports hot reloading of plugins without server restarts.

Build the entire project by running `cargo build` from the root directory. This compiles all the crates and their dependencies. For a production build with optimizations, use `cargo build --release` instead. The build process creates the main server executable and compiles the example plugins as dynamic libraries.

```bash
# Build all crates in development mode
cargo build

# For production (optimized build)
cargo build --release
```

During the build process, Cargo compiles the core server from the `horizon` crate, builds the event system and plugin framework as libraries, compiles example plugins as dynamic libraries with extensions like `.so`, `.dll`, or `.dylib` depending on your platform, and downloads and compiles all dependencies.

## Understanding Configuration

Horizon uses a TOML configuration file to control server behavior. The main configuration sections control the server binding address, world region boundaries, plugin settings, and logging levels. Let's examine the key sections:

```toml
[server]
bind_address = "127.0.0.1:8080"    # Where the server listens
max_connections = 1000              # Maximum concurrent players
connection_timeout = 60             # Seconds before timeout

[server.region]
# 3D world boundaries this server instance manages
min_x = -1000.0
max_x = 1000.0
min_y = -1000.0  
max_y = 1000.0
min_z = -100.0
max_z = 100.0

[plugins]
directory = "plugins"               # Where to find plugin libraries
auto_load = true                   # Load all plugins on startup
whitelist = []                     # Specific plugins to load (empty = all)

[logging]
level = "info"                     # debug, info, warn, error
json_format = false                # Human readable vs JSON logs
```

The server section defines where your server listens for connections. For local development, use `127.0.0.1:8080`, but change this to `0.0.0.0:8080` if you need other machines to connect. The max_connections setting controls how many simultaneous players can connect, and connection_timeout sets how long to wait before dropping idle connections.

Region boundaries define the 3D space that this server instance manages. This becomes important when running multiple server instances that handle different areas of your game world. The coordinates define a box in 3D space using min/max values for x, y, and z axes.

Plugin configuration tells Horizon where to find plugin libraries and which ones to load. The directory setting points to where compiled plugins are stored, typically the `plugins/` folder. Setting auto_load to true makes the server load all compatible libraries it finds, while the whitelist array lets you specify exactly which plugins to load if you prefer more control.

You can create and modify your configuration by copying the included example:

```bash
# The server will create a default config if none exists
# You can also copy and modify the included config
cp config.toml my_config.toml

# Edit configuration as needed
nano my_config.toml
```

## Running Your First Server

Start your Horizon server by running the following commands. The server will create a default configuration file if none exists, and you can specify custom configurations as needed:

```bash
# Run with default configuration
cargo run --bin horizon

# Or use a custom config file
cargo run --bin horizon -- --config my_config.toml

# Run the release build (faster)
./target/release/horizon --config config.toml
```

During startup, you'll see output similar to this, which shows the server binding to your configured address, generating a unique region ID, discovering and loading plugins, and reporting readiness:

```
🚀 Starting game server on 127.0.0.1:8080
🌍 Region ID: 12345678-1234-5678-9abc-123456789abc
🔌 Loading plugins from: plugins
✅ Successfully loaded 2 plugins: ["greeter", "logger"]
📊 Plugin System Status:
  - Plugins loaded: 2
  - Total handlers: 8
  - Client events routed: 0
🌐 Server listening on 127.0.0.1:8080
```

The startup process involves server initialization where it binds to the configured address, region assignment where it creates a unique ID for this server instance, plugin loading where it discovers and loads all `.so`/`.dll`/`.dylib` files, event registration where plugins register their event handlers, and finally reaching a ready state where the server accepts connections.

To test basic connectivity, open another terminal and use a WebSocket client:

```bash
# Using websocat (install with: cargo install websocat)
websocat ws://127.0.0.1:8080

# Or using curl for basic connectivity test
curl -I http://127.0.0.1:8080
```

## Understanding the Plugin Architecture

Horizon's plugin system is what makes it powerful and flexible. Instead of hardcoding game logic into the server, plugins handle all game-specific functionality while the core server manages connections, message routing, and plugin lifecycle.

Each plugin implements the SimplePlugin trait, which requires a name, version, and three main methods. Here's the basic structure:

```rust
// Every plugin implements the SimplePlugin trait
#[async_trait]
impl SimplePlugin for MyPlugin {
    fn name(&self) -> &str { "my_plugin" }
    fn version(&self) -> &str { "1.0.0" }
    
    // Register event handlers
    async fn register_handlers(&mut self, events: Arc<EventSystem>) -> Result<(), PluginError> {
        // Handle player connections
        events.on_core("player_connected", |event: PlayerConnectedEvent| {
            println!("Player joined: {}", event.player_id);
            Ok(())
        }).await?;
        
        // Handle client messages
        events.on_client("chat", "message", |event: ChatMessage| {
            println!("Chat: {}", event.message);
            Ok(())
        }).await?;
        
        Ok(())
    }
    
    // Plugin initialization
    async fn on_init(&mut self, context: Arc<dyn ServerContext>) -> Result<(), PluginError> {
        context.log(LogLevel::Info, "My plugin started!");
        Ok(())
    }
}
```

The `register_handlers` method is where plugins tell the event system what events they want to receive. The `on_init` method handles startup tasks, and `on_shutdown` handles cleanup when the server stops.

The event system provides three types of events. Core events are server infrastructure events like player connections and disconnections. Client events are messages sent by game clients, organized by namespace and event type. Plugin events enable communication between different plugins.

You can explore the example plugins to see these concepts in action. The greeter plugin in `crates/plugin_greeter/src/lib.rs` shows how to handle player connections and chat messages, while demonstrating inter-plugin communication and event handling patterns. The logger plugin in `crates/plugin_logger/src/lib.rs` demonstrates comprehensive event monitoring, tracking player activities, and periodic task scheduling.

Let's look at what happens during plugin loading. First, plugins are built as dynamic libraries, then the server discovers all compatible library files in the plugins directory. It loads each library and creates plugin instances, followed by a two-phase initialization where all plugins register their handlers before any plugin's init method is called. Finally, each plugin's initialization method runs, and the server reports the final statistics.

## Creating Your First Plugin

The fbcli tool makes creating new plugins straightforward. You can create a new plugin with a single command that sets up the entire project structure correctly:

```bash
# Create a new plugin using fbcli
fbcli horizon plugin new my_welcome_plugin

# Navigate to the new plugin directory
cd my_welcome_plugin
```

This command clones the Horizon-Plugin-Sample repository, updates the Cargo.toml with your plugin name, replaces the sample code with a basic template, and cleans up unnecessary files. The resulting plugin has the correct structure and dependencies already configured.

If you want to see the plugin creation process step by step manually, you can also create a plugin the traditional way. First, create a new plugin crate with `cargo new --lib crates/plugin_welcome`, then navigate to the directory with `cd crates/plugin_welcome`.

Configure the plugin crate by editing `crates/plugin_welcome/Cargo.toml`:

```toml
[package]
name = "plugin_welcome"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]  # Required for dynamic loading

[dependencies]
event_system = { path = "../event_system" }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
async-trait = "0.1"
```

The `crate-type = ["cdylib"]` setting is crucial as it creates a dynamic library that can be loaded at runtime. The dependencies match what the server provides, and path dependencies point to the local event system.

Now implement your plugin by creating `crates/plugin_welcome/src/lib.rs`:

```rust
use async_trait::async_trait;
use event_system::{
    create_simple_plugin, current_timestamp, register_handlers, EventSystem, LogLevel,
    PlayerId, PluginError, ServerContext, SimplePlugin,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// A simple welcome plugin that greets players with custom messages
pub struct WelcomePlugin {
    name: String,
    welcome_count: u32,
}

impl WelcomePlugin {
    pub fn new() -> Self {
        println!("🎉 WelcomePlugin: Creating new instance");
        Self {
            name: "welcome".to_string(),
            welcome_count: 0,
        }
    }
}

// Define custom events for this plugin
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerJoinEvent {
    pub player_id: PlayerId,
    pub welcome_number: u32,
    pub timestamp: u64,
}

#[async_trait]
impl SimplePlugin for WelcomePlugin {
    fn name(&self) -> &str {
        &self.name
    }

    fn version(&self) -> &str {
        "1.0.0"
    }

    async fn register_handlers(&mut self, events: Arc<EventSystem>) -> Result<(), PluginError> {
        println!("🎉 WelcomePlugin: Registering event handlers...");

        // Handle player connections
        register_handlers!(events; core {
            "player_connected" => |event: serde_json::Value| {
                println!("🎉 WelcomePlugin: New player joined! Sending welcome message...");
                // In a real implementation, you'd extract player_id and send a welcome message
                Ok(())
            }
        })?;

        // Handle custom welcome commands
        register_handlers!(events; client {
            "chat", "message" => |event: serde_json::Value| {
                if let Some(message) = event.get("message").and_then(|m| m.as_str()) {
                    if message.starts_with("/welcome") {
                        println!("🎉 WelcomePlugin: Player requested welcome info!");
                        // Send welcome information back to player
                    }
                }
                Ok(())
            }
        })?;

        println!("🎉 WelcomePlugin: ✅ Handlers registered successfully!");
        Ok(())
    }

    async fn on_init(&mut self, context: Arc<dyn ServerContext>) -> Result<(), PluginError> {
        context.log(
            LogLevel::Info,
            "🎉 WelcomePlugin: Started! Ready to welcome players with style!",
        );

        // Announce to other plugins
        let events = context.events();
        events
            .emit_plugin(
                "welcome",
                "startup",
                &serde_json::json!({
                    "plugin": "welcome",
                    "version": self.version(),
                    "message": "Welcome plugin is ready to greet players!",
                    "timestamp": current_timestamp()
                }),
            )
            .await
            .map_err(|e| PluginError::InitializationFailed(e.to_string()))?;

        println!("🎉 WelcomePlugin: ✅ Initialization complete!");
        Ok(())
    }

    async fn on_shutdown(&mut self, context: Arc<dyn ServerContext>) -> Result<(), PluginError> {
        context.log(
            LogLevel::Info,
            &format!(
                "🎉 WelcomePlugin: Shutting down. Welcomed {} players total!",
                self.welcome_count
            ),
        );

        println!("🎉 WelcomePlugin: ✅ Shutdown complete!");
        Ok(())
    }
}

// This macro creates the required plugin entry points
create_simple_plugin!(WelcomePlugin);
```

The plugin structure includes a plugin struct that holds plugin state and configuration, event handlers that respond to server and client events, lifecycle methods for initialization and cleanup, and the `create_simple_plugin!` macro that generates the required C interface for dynamic loading.

If you created the plugin manually, you'll need to add it to the workspace by editing the main `Cargo.toml`:

```toml
[workspace]
members = [
    "crates/horizon",
    "crates/game_server", 
    "crates/event_system",
    "crates/plugin_system",
    "crates/plugin_greeter",
    "crates/plugin_logger",
    "crates/plugin_welcome",  # Add your plugin here
]
```

## Building and Deploying Plugins

Whether you created your plugin with fbcli or manually, you can build and deploy it using the fbcli build command or traditional cargo commands:

```bash
# Using fbcli (recommended)
fbcli horizon plugin build

# Or manually from the project root
cargo build --release

# Deploy manually to plugins directory
cp target/release/libplugin_welcome.so plugins/welcome.so
# Windows: copy target\release\plugin_welcome.dll plugins\welcome.dll
# macOS: cp target/release/libplugin_welcome.dylib plugins/welcome.dylib
```

The fbcli build command automatically handles building the plugin in release mode, locating the compiled library file, and copying it to the Horizon plugins directory with the correct naming convention. It can also use a custom Horizon path with `--horizon-path` or skip the copy step entirely with `--no-copy`.

The plugin naming convention is important to understand. The source crate might be named `plugin_welcome`, which creates a library file like `libplugin_welcome.so`, but the runtime name becomes `welcome.so` without the lib prefix and with the correct extension for your platform.

## Testing Your Plugin

Once your plugin is built and deployed, restart the server to load it:

```bash
cargo run --bin horizon
```

Look for your plugin in the startup logs. You should see something like this:

```
✅ Successfully loaded 3 plugins: ["greeter", "logger", "welcome"]
🎉 WelcomePlugin: Started! Ready to welcome players with style!
```

Now you can test the plugin functionality by connecting with a test client. Create a file called `test_client.html` to test the WebSocket connection:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Horizon Test Client</title>
</head>
<body>
    <div id="status">Connecting...</div>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        const ws = new WebSocket('ws://127.0.0.1:8080');
        const status = document.getElementById('status');
        const messages = document.getElementById('messages');
        
        ws.onopen = function() {
            status.textContent = 'Connected to Horizon!';
            status.style.color = 'green';
        };
        
        ws.onmessage = function(event) {
            const div = document.createElement('div');
            div.textContent = `Server: ${event.data}`;
            messages.appendChild(div);
        };
        
        ws.onclose = function() {
            status.textContent = 'Disconnected';
            status.style.color = 'red';
        };
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = {
                namespace: "chat",
                event: "message", 
                data: {
                    message: input.value,
                    channel: "general"
                }
            };
            
            ws.send(JSON.stringify(message));
            input.value = '';
        }
        
        // Send hello on connection
        ws.onopen = function() {
            status.textContent = 'Connected to Horizon!';
            setTimeout(() => {
                const greeting = {
                    namespace: "chat",
                    event: "message",
                    data: {
                        message: "Hello from test client!",
                        channel: "general"
                    }
                };
                ws.send(JSON.stringify(greeting));
            }, 1000);
        };
    </script>
</body>
</html>
```

Open this file in your browser while the server is running. You should see the connection establish, and when you send messages (especially ones starting with "/welcome"), you'll see your plugin respond in the server logs.

The message flow works like this: the client connects via WebSocket and the server creates a PlayerConnectedEvent, your plugin receives the event and logs it, when the client sends a chat message the server routes it to the chat namespace, and your plugin handles the message if it matches your criteria.

## Monitoring and Debugging

Horizon provides detailed logging to help you understand what's happening in your server and plugins. You can control the logging level to get more or less detail:

```bash
# Run with debug logging for more detail
RUST_LOG=debug cargo run --bin horizon

# Filter logs to specific components
RUST_LOG=plugin_system=debug,event_system=info cargo run --bin horizon

# Enable backtraces for debugging crashes
RUST_BACKTRACE=1 cargo run --bin horizon
```

The log levels provide different amounts of information. ERROR shows critical failures that may crash the server, WARN shows problems that are handled but worth noting, INFO shows normal operational messages, DEBUG provides detailed information for troubleshooting, and TRACE gives very verbose output for deep debugging.

You can monitor plugin performance and statistics through the server's built-in reporting. The server displays statistics on startup and periodically shows information about plugins loaded, total handlers registered, and client events routed.

When debugging plugin issues, there are several common problems to check for. If a plugin won't load, verify the plugin directory with `ls -la plugins/`, check the plugin library format with `file plugins/welcome.so`, and look for missing symbols with `nm -D plugins/welcome.so | grep create_plugin`.

For connection issues, test basic connectivity with `curl -I http://127.0.0.1:8080`, check if the port is in use with `netstat -tlnp | grep 8080`, and verify WebSocket upgrades work with `websocat ws://127.0.0.1:8080 --text`.

## Repository Management with fbcli

The fbcli tool provides comprehensive repository management features that make working with the Far Beyond ecosystem easier. Beyond the basic clone and list commands, you can use several other repository management features.

To keep your local repositories up to date, use `fbcli repo update` which will update all Far Beyond repositories in your current directory. If you want to see what would be updated without making changes, add the `--dry-run` flag. You can check the status of all local repositories with `fbcli repo status`, which shows the current branch, working directory status, and whether you're ahead or behind the remote.

When cloning repositories, you have additional options. Use `fbcli repo clone <repo> --ssh` to clone using SSH instead of HTTPS, or specify a custom directory with `fbcli repo clone <repo> --path /custom/path`. The tool automatically handles the Far Beyond organization structure and ensures proper setup.

## Advanced Plugin Development

Once you have a working plugin, you can explore more advanced features. Inter-plugin communication allows plugins to coordinate with each other through events:

```rust
// Send data to another plugin
events.emit_plugin("inventory", "item_used", &item_data).await?;

// Listen for events from other plugins
events.on_plugin("combat", "damage_dealt", |event: DamageEvent| {
    // Handle damage event
    Ok(())
}).await?;
```

You can also communicate directly with clients by sending messages back to specific players or broadcasting to all connected players:

```rust
// Send messages back to specific players
context.send_to_player(player_id, response_data).await?;

// Broadcast to all connected players
context.broadcast(announcement_data).await?;
```

Plugins can maintain persistent state by storing data in memory and saving to files when needed. This allows you to preserve important game state across server restarts and provide continuity for players.

## Production Deployment

When you're ready to deploy your Horizon server in production, there are several important considerations. Always use release builds created with `cargo build --release` for better performance. Configure proper logging with appropriate levels and log rotation to manage disk space. Monitor server performance using tools like htop, prometheus, or other monitoring solutions.

Set up process supervision using systemd, docker, or other process managers to ensure your server restarts automatically if it crashes. Configure firewalls to open only the necessary ports for your game clients. Plan for updates by testing plugin hot-reloading procedures and having rollback strategies ready.

You might also want to use the included Docker support for containerized deployment. The project includes a Dockerfile and docker-compose.yml that handle the production build process and provide a clean deployment environment.

## Next Steps and Community

With a working Horizon server and your first custom plugin, you're ready to build more complex game features. Consider exploring the Far Beyond plugin ecosystem for existing functionality you can use, building game-specific features like inventory systems, combat mechanics, or economy systems, and scaling your server with clustering and load balancing as your player base grows.

The Horizon community is active and helpful for developers at all levels. Join the Discord server at https://discord.gg/NM4awJWGWu to chat with other developers, get help with problems, and share your creations. The GitHub repository at https://github.com/Far-Beyond-Dev/Horizon is where you can report issues, contribute code, and stay up to date with the latest developments.

You can also explore the full documentation at https://horizon.farbeyond.dev/docs for more detailed information about advanced features, best practices, and architectural decisions. Contributing back to the Horizon community by sharing plugins, reporting bugs, or improving documentation helps everyone build better games.

## Congratulations!

You now have a working Horizon server running with plugins, an understanding of the plugin architecture and event system, your first custom plugin that responds to events, a test client to interact with your server, and knowledge of debugging and monitoring techniques.

Your Horizon server is ready for game development. The plugin-based architecture means you can build complex game logic without modifying the core server, enabling rapid development and easy maintenance. Welcome to the future of game server development!