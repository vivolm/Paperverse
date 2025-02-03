#Handles communication of different scripts via Websocket

import asyncio
import websockets
import json

# Dictionary to store connected clients
clients = {
    "python": None,
    "node": None,
    "browser": None
}

async def handler(websocket):
    try:
        # Identify the client type
        async for message in websocket:
            data = json.loads(message)
            client_type = data.get("type")
            
            if client_type in clients:
                clients[client_type] = websocket
                print(f"{client_type} connected.")

            # Route messages to other clients
            if client_type == "python":
                if clients["node"]:
                    nested_data = data.get("data")  # Use `get` to safely access keys
                    if nested_data != None:
                        await clients["node"].send(json.dumps(nested_data))
                        print(nested_data)
                        print("position data recieved and sent to node.")
                    
            elif client_type == "node":
                print("got node message")
                if clients["browser"]:
                    nested_data = data.get("data")  # Use `get` to safely access keys
                    if nested_data:
                        # Send the nested data object to the browser
                        await clients["browser"].send(json.dumps(nested_data))
                        print(nested_data)
                        print("SVG received and sent to browser.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Remove the client on disconnect
        for key, client in clients.items():
            if client == websocket:
                clients[key] = None
                print(f"{key} disconnected.")

# Start the server
async def main():
    async with websockets.serve(handler, "localhost", 8080):
        print("WebSocket server running on ws://localhost:8080")
        await asyncio.Future()  # Run forever

asyncio.run(main())