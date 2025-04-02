from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")

@mcp.tool()
async def suggest_hotels(location: str, check_in: str, check_out: str) -> str:
    """
    Suggest hotels based on location and dates.
    """
    # Placeholder logic for hotel suggestion
    return [{
            "name": "Hotel Example",
            "location": "Downtown"
        }]


@mcp.tool()
async def suggest_flights(from_location: str, to_location: str, departure_date: str, return_date: str) -> str:
    """
    Suggest flights based on locations and date.
    """
    # Placeholder logic for flight suggestion
    return [{
            "flight_number": "FL123",
            "departure": "2023-10-01T10:00:00Z",
            "arrival": "2023-10-01T12:00:00Z"
        }]

if __name__ == "__main__":
    mcp.run(transport="sse")
