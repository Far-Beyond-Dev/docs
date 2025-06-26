---
title: Getting started with Development
image:
excerpt: A starting point to learn about developing for Horizon
tags: ["basics", "contributor", "tutorial"]
stability: stable
---

# Horizon Core Server Development Guide

🛠️ **Your comprehensive guide to contributing to the Horizon game server internals.**

Welcome to Horizon core server development! This guide is for developers who want to contribute to the server's internal architecture, networking stack, performance optimizations, and core infrastructure. You'll be working on the foundational systems that power the entire Horizon ecosystem, not building plugins but improving the engine itself.

## Understanding the Core Server Architecture

Horizon's core server is designed as a high-performance, event-driven networking engine that provides the foundation for plugin-based game development. The server's primary responsibilities include managing WebSocket connections at scale, routing messages efficiently between clients and the plugin system, providing a type-safe event system for internal communication, coordinating application lifecycle and configuration management, and maintaining performance under high concurrent load.

The core server deliberately avoids implementing any game-specific logic. Instead, it provides robust infrastructure that plugins can build upon. This separation allows the core to focus entirely on performance, reliability, and providing clean APIs for the plugin ecosystem.

The server uses an async-first architecture built on tokio, which enables handling thousands of concurrent connections with minimal resource usage. All I/O operations are non-blocking, the event system uses async handlers throughout, connection management scales horizontally, and the architecture supports efficient message broadcasting.

Understanding this foundation is crucial because your changes to the core server affect every plugin and every game built on Horizon. Performance improvements benefit the entire ecosystem, while architectural changes must maintain backward compatibility with existing plugins.

## Core Server Implementation Deep Dive

The heart of the server lives in `crates/game_server/src/lib.rs` and centers around the GameServer struct. This struct orchestrates all the major subsystems and manages the server lifecycle from startup through graceful shutdown.

The GameServer contains several key components. The event_system provides the communication backbone used internally by the server and exposed to plugins. The connection_manager handles all client connections and their lifecycle management. The plugin_manager coordinates with plugins but is not part of the core server concerns. The config contains server configuration like bind addresses, connection limits, and performance tuning parameters. Finally, the shutdown_sender coordinates graceful shutdown across all subsystems.

The server's main loop in the `start()` method uses tokio::select! to handle multiple concurrent operations. It accepts new TCP connections continuously, processes existing connection messages, handles shutdown signals gracefully, and coordinates with the plugin system for message routing. This event-driven architecture ensures the server remains responsive even under high load.

Connection handling happens in the `handle_connection` function, which manages the complete lifecycle of a client connection. The function performs WebSocket handshake using tokio-tungstenite, splits the connection into sender and receiver halves for concurrent processing, manages connection metadata and player association, routes incoming messages to the event system, and handles connection cleanup when clients disconnect.

The connection architecture uses a producer-consumer pattern where incoming messages are processed immediately and outgoing messages are queued through a broadcast channel. This ensures that slow message processing doesn't block new incoming messages and that the server can handle bursty traffic patterns efficiently.

## Event System Internals and Performance

The event system in `crates/event_system/src/lib.rs` is the communication backbone of the entire server. Understanding its internal implementation is crucial for core development because it affects performance throughout the system.

The EventSystem struct maintains handlers in a `RwLock<HashMap<String, Vec<Arc<dyn EventHandler>>>>` structure. This design allows multiple readers to access handlers concurrently while serializing writes when new handlers are registered. The choice of RwLock over Mutex provides better read performance since event emission happens much more frequently than handler registration.

Event routing uses string-based keys that encode the event type and namespace. Core events use keys like "core:player_connected", client events use "client:namespace:event_name", and plugin events use "plugin:plugin_name:event_name". This string-based approach provides flexibility and clear separation between event types while maintaining reasonable performance through HashMap lookups.

The event emission path in `emit_event` is performance-critical since it's called for every message and internal event. The implementation minimizes allocations by reusing serialized event data across multiple handlers, uses Arc to avoid cloning heavy event data, and processes handlers concurrently where possible. When optimizing this path, be extremely careful about maintaining correctness while improving performance.

Type safety is maintained through the Event trait and TypedEventHandler wrapper. The Event trait requires Serialize + DeserializeOwned + Send + Sync, ensuring events can be safely passed between async contexts. The TypedEventHandler wraps closures and handles deserialization automatically, providing type safety without runtime overhead.

The event system maintains statistics about handler counts, events emitted, and performance metrics. These statistics are used for monitoring server health and can help identify performance bottlenecks in production deployments.

## Network Layer and Connection Management

The networking layer handles the low-level details of WebSocket communication and connection lifecycle management. This layer must be extremely robust because connection handling issues can affect all connected players.

Connection establishment begins when a TCP connection is accepted in the main server loop. The connection is immediately upgraded to WebSocket using `accept_async` from tokio-tungstenite. If the handshake fails, the connection is dropped immediately to prevent resource leaks. Successful connections are passed to `handle_connection` for processing.

The ConnectionManager struct tracks all active connections and provides the interface for sending messages to specific clients or broadcasting to all connections. It maintains a HashMap of connection metadata indexed by connection ID, uses atomic counters for generating unique connection IDs, and provides a broadcast channel for efficient message distribution.

Connection handling splits the WebSocket stream into sender and receiver halves, allowing concurrent processing of incoming and outgoing messages. The receiver task processes incoming messages immediately and routes them to the event system. The sender task listens on a broadcast channel and forwards messages to the client. This split architecture prevents slow message processing from blocking other operations.

Message routing happens through the `route_client_message` function that parses incoming JSON messages and determines how to handle them. The function validates message format, extracts namespace and event information, converts raw JSON to appropriate event types, and emits events through the event system for plugin handling. Error handling in this path is critical because malformed messages should not crash the server or affect other connections.

The server supports WebSocket ping/pong for connection health monitoring. Clients that don't respond to ping messages are automatically disconnected to prevent resource leaks from dead connections. The ping interval and timeout are configurable to balance responsiveness with network efficiency.

## Application Lifecycle and Configuration Management

The main application in `crates/horizon/src/main.rs` coordinates the entire server lifecycle and handles configuration management, logging setup, and graceful shutdown procedures. Understanding this coordination is important for core development because changes often require updates to the application lifecycle.

Configuration loading uses a layered approach where default values are provided, TOML configuration files override defaults, command-line arguments override configuration files, and environment variables can override specific settings. This flexibility supports both development and production deployment scenarios.

The AppConfig struct defines the complete configuration schema with nested structures for different subsystems. The configuration is validated during loading to catch errors early and provide helpful error messages. Invalid configurations cause the server to exit immediately rather than starting with potentially dangerous settings.

Logging setup uses tracing-subscriber with support for multiple output formats and filtering. The logging configuration affects debugging and monitoring capabilities, so changes must maintain compatibility with existing log analysis tools. Structured logging is used throughout the codebase to enable efficient log processing in production environments.

The Application struct manages the complete server lifecycle through its `run()` method. This method coordinates configuration loading, logging initialization, GameServer creation and startup, signal handling for graceful shutdown, and cleanup of all resources. The lifecycle management ensures that the server can start and stop cleanly even when plugins or connections are active.

Signal handling supports both SIGINT and SIGTERM on Unix systems and Ctrl+C on Windows. When a shutdown signal is received, the server begins graceful shutdown by stopping new connection acceptance, notifying existing connections to close, waiting for active operations to complete, and cleaning up all resources before exiting.

## Performance Optimization and Monitoring

Performance is critical for game server infrastructure because latency and throughput directly affect player experience. The core server is designed with performance in mind, but optimization is an ongoing effort that requires careful measurement and analysis.

The hot paths in the server include message routing from clients to plugins, event emission and handler processing, connection management and cleanup, and WebSocket frame processing. These paths are executed for every client interaction and must be highly optimized to maintain performance under load.

Memory management focuses on minimizing allocations in hot paths by reusing buffers and data structures where possible, using Arc and shared ownership to avoid copying large data, preferring stack allocation over heap allocation for temporary data, and implementing proper cleanup to prevent memory leaks.

The server uses async/await throughout to avoid blocking the event loop. However, improper async usage can still cause performance problems. Always use non-blocking operations in async contexts, avoid holding locks across await points, spawn separate tasks for CPU-intensive work, and be careful about async recursion and stack usage.

Monitoring and metrics collection happens through the built-in statistics systems in each major component. The EventSystem tracks handler counts and emission rates, the ConnectionManager monitors active connections and message throughput, and the overall server tracks resource usage and performance characteristics. These metrics are essential for understanding server behavior in production.

Profiling tools are crucial for identifying performance bottlenecks. Use `cargo flamegraph` for CPU profiling, `tokio-console` for async runtime analysis, `perf` on Linux for detailed performance analysis, and custom benchmarks for measuring specific performance characteristics. Always profile under realistic load conditions that match production usage patterns.

## Concurrency and Thread Safety

The server uses async/await for concurrency rather than traditional threading, but thread safety is still crucial because the server uses shared state and multi-threaded async runtimes. Understanding the concurrency model is essential for making safe changes to the core server.

Shared state in the server is protected using appropriate synchronization primitives. RwLock is used for read-heavy data like event handlers, Mutex protects mutable state that needs exclusive access, atomic types handle simple counters and flags, and Arc provides shared ownership without requiring locks.

The event system handlers run concurrently, which means handler execution order is not guaranteed and handlers must be thread-safe. Handlers should avoid sharing mutable state, use appropriate synchronization when state sharing is necessary, complete quickly to avoid blocking other handlers, and handle errors gracefully without affecting other handlers.

Connection handling uses separate async tasks for each connection, ensuring that slow or blocked connections don't affect others. However, shared resources like the event system and connection manager must be thread-safe. All public APIs in these components are designed to be safely called from multiple async contexts concurrently.

When adding new shared state or modifying existing concurrency patterns, carefully consider the implications for thread safety and performance. Incorrect synchronization can lead to deadlocks, data races, or performance degradation under load.

## Testing and Quality Assurance

The core server requires comprehensive testing because bugs in the infrastructure affect all users of the platform. The testing strategy includes unit tests for individual components, integration tests for cross-component behavior, performance tests for critical paths, and stress tests for high-load scenarios.

Unit tests focus on individual functions and components in isolation. Test event system registration and emission, connection lifecycle management, configuration loading and validation, message routing logic, and error handling in all code paths. Use mocking where necessary to isolate components from their dependencies.

Integration tests verify that different components work correctly together. Test complete message flow from client to event system, plugin loading and initialization coordination, graceful shutdown with active connections, and configuration changes affecting multiple components. These tests catch issues that unit tests might miss.

Performance testing measures the server's behavior under load and helps identify performance regressions. Create benchmarks for event emission rates, connection handling throughput, message routing latency, and memory usage under typical workloads. Run these benchmarks regularly to catch performance regressions early.

Load testing verifies that the server can handle expected traffic levels without degrading performance or stability. Test with realistic connection counts and message rates, various message sizes and patterns, connection churn scenarios, and resource exhaustion conditions. Load testing often reveals issues that only appear under stress.

## Contributing to Core Development

When contributing to the core server, focus on maintainability, performance, and backward compatibility. The server is the foundation for the entire Horizon ecosystem, so changes must be carefully considered and thoroughly tested.

Before making significant changes, understand the existing architecture and design decisions. Read through the relevant code sections, run the existing tests to understand expected behavior, profile the current implementation to understand performance characteristics, and consider the impact on existing plugins and users.

Follow established patterns and conventions throughout the codebase. Use async/await consistently for all I/O operations, handle errors appropriately with proper propagation, maintain thread safety in all shared code, and document public APIs thoroughly with examples and usage notes.

Performance considerations should guide all development decisions. Measure the impact of changes on hot paths, avoid introducing allocations in performance-critical code, consider the scalability implications of new features, and include appropriate benchmarks for performance-sensitive changes.

The code review process for core changes is thorough because bugs in the infrastructure can affect many users. Expect detailed feedback on architecture, implementation approach, performance implications, test coverage, and documentation quality. The maintainers are committed to helping contributors understand the requirements and improve their contributions.

## Debugging and Troubleshooting

Debugging core server issues requires understanding both the server's internal operation and its interaction with the broader system. Effective debugging starts with comprehensive logging and monitoring to understand what the server is doing during normal operation.

The server uses structured logging throughout, which makes it easier to filter and analyze logs during debugging. Enable debug-level logging for detailed information about server operation, use different log levels for different components to focus on specific areas, and correlate logs across different subsystems to understand complex interactions.

When debugging connection issues, examine both client and server perspectives. Check WebSocket handshake completion, verify message format and routing, monitor connection lifecycle events, and validate error handling behavior. Connection debugging often requires examining network traffic and timing.

Performance issues require systematic measurement and analysis. Use profiling tools to identify bottlenecks, measure resource usage under load, analyze async task scheduling and execution, and compare performance before and after changes. Performance debugging often reveals systemic issues that affect multiple components.

Memory issues can be particularly challenging in async Rust code. Watch for reference cycles that prevent cleanup, ensure proper Drop implementation for resources, monitor memory usage patterns over time, and use tools like Valgrind or AddressSanitizer when available.

The core server's complexity means that debugging often requires understanding interactions between multiple subsystems. Develop a systematic approach to isolating issues, use the extensive test suite to verify assumptions, and don't hesitate to add additional logging or monitoring to understand complex behaviors.

## Future Architecture Considerations

The core server architecture continues to evolve as we learn more about performance characteristics and usage patterns. Understanding the long-term architectural goals helps contributors make decisions that align with the project's direction.

Scalability improvements focus on supporting larger numbers of concurrent connections, more efficient message routing and processing, better resource utilization under varying loads, and horizontal scaling capabilities for distributed deployments.

Performance optimization is an ongoing effort targeting reduced latency for message processing, improved throughput for high-traffic scenarios, more efficient memory usage patterns, and better CPU utilization across multiple cores.

The plugin interface may evolve to provide more capabilities while maintaining backward compatibility. Changes must be carefully designed to avoid breaking existing plugins while enabling new functionality that plugins need.

Monitoring and observability features will expand to provide better insight into server operation and performance. This includes more detailed metrics collection, better debugging capabilities, and integration with external monitoring systems.

Contributing to these architectural improvements requires understanding both the current implementation and the long-term goals. Engage with the maintainers to understand priorities and design directions before beginning significant architectural work.