from opcua import Client, ua

# OPC UA server URL
url = "opc.tcp://localhost:4840"  # Replace with your server's endpoint

# Create a client
client = Client(url)

try:
    # Connect to the server
    client.connect()
    print("Connected to OPC UA server!")

    objects = client.get_objects_node()

    # Add a new variable node under Objects
    my_node = objects.add_variable(
        ua.NodeId("test_var", 2),  # NodeId: "identifier", namespace index
        "test_var",                 # BrowseName
        0                              # Initial value
    )


finally:
    # Disconnect the client
    client.disconnect()
    print("Disconnected from server")
