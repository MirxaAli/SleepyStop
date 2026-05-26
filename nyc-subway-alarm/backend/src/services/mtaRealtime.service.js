import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const MTA_SUBWAY_FEEDS = [
  {
    name: "1234567",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
  },
  {
    name: "ACE",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace"
  },
  {
    name: "BDFM",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm"
  },
  {
    name: "G",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g"
  },
  {
    name: "JZ",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz"
  },
  {
    name: "NQRW",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw"
  },
  {
    name: "L",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l"
  },
  {
    name: "SIR",
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si"
  }
];

function getStopIdVariants(stopId) {
  if (!stopId) return [];

  const cleanStopId = String(stopId).trim();

  const variants = new Set([
    cleanStopId,
    `${cleanStopId}N`,
    `${cleanStopId}S`
  ]);

  return Array.from(variants);
}

async function fetchFeed(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MTA feed error: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );
}

function getMinutesFromNow(timestamp) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = Number(timestamp) - nowSeconds;

  return Math.max(0, Math.round(diffSeconds / 60));
}

function getDirectionFromStopId(stopId) {
  if (stopId.endsWith("N")) return "Uptown / Northbound";
  if (stopId.endsWith("S")) return "Downtown / Southbound";
  return "Direction not specified";
}

export async function getArrivalsForStop(stopId) {
  const stopIdVariants = getStopIdVariants(stopId);
  const allArrivals = [];

  for (const feed of MTA_SUBWAY_FEEDS) {
    try {
      const feedData = await fetchFeed(feed.url);

      feedData.entity.forEach((entity) => {
        const tripUpdate = entity.tripUpdate;

        if (!tripUpdate?.stopTimeUpdate) {
          return;
        }

        tripUpdate.stopTimeUpdate.forEach((stopTime) => {
          if (!stopIdVariants.includes(stopTime.stopId)) {
            return;
          }

          const arrivalTime =
            stopTime.arrival?.time || stopTime.departure?.time;

          if (!arrivalTime) {
            return;
          }

          const minutes = getMinutesFromNow(arrivalTime);

          allArrivals.push({
            route: tripUpdate.trip?.routeId || "Unknown",
            tripId: tripUpdate.trip?.tripId || "",
            stopId: stopTime.stopId,
            direction: getDirectionFromStopId(stopTime.stopId),
            minutes,
            timestamp: Number(arrivalTime),
            feed: feed.name
          });
        });
      });
    } catch (error) {
      console.error(`Failed to fetch ${feed.name} feed:`, error.message);
    }
  }

  return allArrivals
    .filter((arrival) => arrival.timestamp >= Math.floor(Date.now() / 1000))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 12);
}
