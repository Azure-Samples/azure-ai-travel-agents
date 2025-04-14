import random
import re
import uuid
from datetime import datetime, timedelta
from typing import Annotated

from faker import Faker
from mcp.server.fastmcp import FastMCP
from pydantic import Field

mcp = FastMCP("weather")
fake = Faker()


def validate_iso_date(date_str: str, param_name: str) -> datetime.date:
    """
    Validates that a string is in ISO format (YYYY-MM-DD) and returns the parsed date.

    Args:
        date_str: The date string to validate
        param_name: Name of the parameter for error messages

    Returns:
        The parsed date object

    Raises:
        ValueError: If the date is not in ISO format or is invalid
    """
    iso_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    if not iso_pattern.match(date_str):
        raise ValueError(f"{param_name} must be in ISO format (YYYY-MM-DD), got: {date_str}")

    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as e:
        raise ValueError(f"Invalid {param_name}: {e}")


@mcp.tool()
async def suggest_hotels(
    location: Annotated[str, Field(description="Location (city or area) to search for hotels")],
    check_in: Annotated[str, Field(description="Check-in date in ISO format (YYYY-MM-DD)")],
    check_out: Annotated[str, Field(description="Check-out date in ISO format (YYYY-MM-DD)")],
) -> str:
    """
    Suggest hotels based on location and dates.
    """
    # Validate dates
    check_in_date = validate_iso_date(check_in, "check_in")
    check_out_date = validate_iso_date(check_out, "check_out")

    # Ensure check_out is after check_in
    if check_out_date <= check_in_date:
        raise ValueError("check_out date must be after check_in date")

    # Create realistic mock data for hotels
    hotel_types = ["Luxury", "Boutique", "Budget", "Business"]
    amenities = ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Room Service", "Parking"]

    # Generate a rating between 3.0 and 5.0
    def generate_rating():
        return round(random.uniform(3.0, 5.0), 1)

    # Generate a price based on hotel type
    def generate_price(hotel_type):
        price_ranges = {
            "Luxury": (250, 600),
            "Boutique": (180, 350),
            "Budget": (80, 150),
            "Resort": (200, 500),
            "Business": (150, 300),
        }
        min_price, max_price = price_ranges.get(hotel_type, (100, 300))
        return round(random.uniform(min_price, max_price))

    # Generate between 3 and 8 hotels
    num_hotels = random.randint(3, 8)
    hotels = []

    neighborhoods = [
        "Downtown",
        "Historic District",
        "Waterfront",
        "Business District",
        "Arts District",
        "University Area",
    ]

    for i in range(num_hotels):
        hotel_type = random.choice(hotel_types)
        hotel_amenities = random.sample(amenities, random.randint(3, 6))
        neighborhood = random.choice(neighborhoods)

        hotel = {
            "name": f"{hotel_type} {['Hotel', 'Inn', 'Suites', 'Resort', 'Plaza'][random.randint(0, 4)]}",
            "address": fake.street_address(),
            "location": f"{neighborhood}, {location}",
            "rating": generate_rating(),
            "price_per_night": generate_price(hotel_type),
            "hotel_type": hotel_type,
            "amenities": hotel_amenities,
            "available_rooms": random.randint(1, 15),
        }
        hotels.append(hotel)

    # Sort by rating to show best hotels first
    hotels.sort(key=lambda x: x["rating"], reverse=True)
    return hotels


@mcp.tool()
async def suggest_flights(
    from_location: Annotated[str, Field(description="Departure location (city or airport)")],
    to_location: Annotated[str, Field(description="Destination location (city or airport)")],
    departure_date: Annotated[str, Field(description="Departure date in ISO format (YYYY-MM-DD)")],
    return_date: Annotated[str | None, Field(description="Return date in ISO format (YYYY-MM-DD)")] = None,
) -> str:
    """
    Suggest flights based on locations and dates.
    """
    # Validate dates
    dep_date = validate_iso_date(departure_date, "departure_date")
    ret_date = None
    if return_date:
        ret_date = validate_iso_date(return_date, "return_date")
        # Ensure return date is after departure date
        if ret_date <= dep_date:
            raise ValueError("return_date must be after departure_date")

    # Create realistic mock data for flights
    airlines = [
        "SkyWings",
        "Global Air",
        "Atlantic Airways",
        "Pacific Express",
        "Mountain Jets",
        "Stellar Airlines",
        "Sunshine Airways",
        "Northern Flights",
    ]

    aircraft_types = ["Boeing 737", "Airbus A320", "Boeing 787", "Airbus A350", "Embraer E190", "Bombardier CRJ900"]

    # Generate airport codes based on locations
    def generate_airport_code(city):
        # Simple simulation of airport codes
        # In reality, this would use a database of real airport codes
        vowels = "AEIOU"
        consonants = "BCDFGHJKLMNPQRSTVWXYZ"

        # Use first letter of city if possible
        first_char = city[0].upper()
        if first_char in consonants:
            code = first_char
        else:
            code = random.choice(consonants)

        # Add two random letters, preferring consonants
        for _ in range(2):
            if random.random() < 0.7:  # 70% chance of consonant
                code += random.choice(consonants)
            else:
                code += random.choice(vowels)

        return code

    from_code = generate_airport_code(from_location)
    to_code = generate_airport_code(to_location)

    # Generate departure flights
    departure_flights = []
    num_dep_flights = random.randint(3, 7)

    for _ in range(num_dep_flights):
        # Generate departure time (between 6 AM and 10 PM)
        hour = random.randint(6, 22)
        minute = random.choice([0, 15, 30, 45])
        # Convert date to datetime before setting hour and minute
        dep_time = datetime.combine(dep_date, datetime.min.time()).replace(hour=hour, minute=minute)

        # Flight duration between 1 and 8 hours
        flight_minutes = random.randint(60, 480)
        arr_time = dep_time + timedelta(minutes=flight_minutes)

        # Determine if this is a direct or connecting flight
        is_direct = random.random() < 0.6  # 60% chance of direct flight

        flight = {
            "flight_id": str(uuid.uuid4())[:8].upper(),
            "airline": random.choice(airlines),
            "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
            "aircraft": random.choice(aircraft_types),
            "from_airport": {
                "code": from_code,
                "name": f"{from_location} International Airport",
                "city": from_location,
            },
            "to_airport": {"code": to_code, "name": f"{to_location} International Airport", "city": to_location},
            "departure": dep_time.isoformat(),
            "arrival": arr_time.isoformat(),
            "duration_minutes": flight_minutes,
            "is_direct": is_direct,
            "price": round(random.uniform(99, 999), 2),
            "currency": "USD",
            "available_seats": random.randint(1, 30),
            "cabin_class": random.choice(["Economy", "Premium Economy", "Business", "First"]),
        }

        # Add connection info for non-direct flights
        if not is_direct:
            # Create a connection point
            connection_codes = ["ATL", "ORD", "DFW", "LHR", "CDG", "DXB", "AMS", "FRA"]
            connection_code = random.choice(connection_codes)

            # Split the flight into segments
            segment1_duration = round(flight_minutes * random.uniform(0.3, 0.7))
            segment2_duration = flight_minutes - segment1_duration

            connection_time = random.randint(45, 180)  # between 45 minutes and 3 hours

            segment1_arrival = dep_time + timedelta(minutes=segment1_duration)
            segment2_departure = segment1_arrival + timedelta(minutes=connection_time)

            flight["segments"] = [
                {
                    "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
                    "from_airport": flight["from_airport"],
                    "to_airport": {
                        "code": connection_code,
                        "name": f"{connection_code} International Airport",
                        "city": connection_code,
                    },
                    "departure": dep_time.isoformat(),
                    "arrival": segment1_arrival.isoformat(),
                    "duration_minutes": segment1_duration,
                },
                {
                    "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
                    "from_airport": {
                        "code": connection_code,
                        "name": f"{connection_code} International Airport",
                        "city": connection_code,
                    },
                    "to_airport": flight["to_airport"],
                    "departure": segment2_departure.isoformat(),
                    "arrival": arr_time.isoformat(),
                    "duration_minutes": segment2_duration,
                },
            ]
            flight["connection_airport"] = connection_code
            flight["connection_duration_minutes"] = connection_time

        departure_flights.append(flight)

    # Generate return flights if return_date is provided
    return_flights = []
    if ret_date:
        num_ret_flights = random.randint(3, 7)

        for _ in range(num_ret_flights):
            # Similar logic as departure flights but for return
            hour = random.randint(6, 22)
            minute = random.choice([0, 15, 30, 45])
            # Convert date to datetime before setting hour and minute
            dep_time = datetime.combine(ret_date, datetime.min.time()).replace(hour=hour, minute=minute)

            flight_minutes = random.randint(60, 480)
            arr_time = dep_time + timedelta(minutes=flight_minutes)

            is_direct = random.random() < 0.6

            flight = {
                "flight_id": str(uuid.uuid4())[:8].upper(),
                "airline": random.choice(airlines),
                "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
                "aircraft": random.choice(aircraft_types),
                "from_airport": {"code": to_code, "name": f"{to_location} International Airport", "city": to_location},
                "to_airport": {
                    "code": from_code,
                    "name": f"{from_location} International Airport",
                    "city": from_location,
                },
                "departure": dep_time.isoformat(),
                "arrival": arr_time.isoformat(),
                "duration_minutes": flight_minutes,
                "is_direct": is_direct,
                "price": round(random.uniform(99, 999), 2),
                "currency": "USD",
                "available_seats": random.randint(1, 30),
                "cabin_class": random.choice(["Economy", "Premium Economy", "Business", "First"]),
            }

            # Add connection info for non-direct flights
            if not is_direct:
                connection_codes = ["ATL", "ORD", "DFW", "LHR", "CDG", "DXB", "AMS", "FRA"]
                connection_code = random.choice(connection_codes)

                segment1_duration = round(flight_minutes * random.uniform(0.3, 0.7))
                segment2_duration = flight_minutes - segment1_duration

                connection_time = random.randint(45, 180)

                segment1_arrival = dep_time + timedelta(minutes=segment1_duration)
                segment2_departure = segment1_arrival + timedelta(minutes=connection_time)

                flight["segments"] = [
                    {
                        "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
                        "from_airport": flight["from_airport"],
                        "to_airport": {
                            "code": connection_code,
                            "name": f"{connection_code} International Airport",
                            "city": connection_code,
                        },
                        "departure": dep_time.isoformat(),
                        "arrival": segment1_arrival.isoformat(),
                        "duration_minutes": segment1_duration,
                    },
                    {
                        "flight_number": f"{random.choice('ABCDEFG')}{random.randint(100, 9999)}",
                        "from_airport": {
                            "code": connection_code,
                            "name": f"{connection_code} International Airport",
                            "city": connection_code,
                        },
                        "to_airport": flight["to_airport"],
                        "departure": segment2_departure.isoformat(),
                        "arrival": arr_time.isoformat(),
                        "duration_minutes": segment2_duration,
                    },
                ]
                flight["connection_airport"] = connection_code
                flight["connection_duration_minutes"] = connection_time

            return_flights.append(flight)

    # Combine into a single response
    response = {"departure_flights": departure_flights, "return_flights": return_flights if ret_date else []}

    # Return the flights
    return response


if __name__ == "__main__":
    mcp.run(transport="sse")
