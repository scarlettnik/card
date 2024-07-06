let map = L.map("mymap").setView([55.753995, 37.614069], 10);
let ourData = [];
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 20,
  minZoom: 1,
  tileSize: 512,
  zoomOffset: -1,
}).addTo(map);

const form = document.getElementById("target-audience-form");
const loader1 = document.getElementById('loader1')
const loader2 = document.getElementById('loader2')
const metr = document.getElementById('metr')
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  loader2.style.display = 'block'
  const formData = {
    target_audience: {
      age_from: parseInt(form.elements.age_from.value),
      age_to: parseInt(form.elements.age_to.value),
      gender: form.elements.gender.value,
      income: form.elements.income.value,
    },
    count: parseInt(form.elements.count.value),
    mode: form.elements.mode.value,
  };

  try {
    const response = await fetch(
      "https://crack-locally-skink.ngrok-free.app/polygons",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    loader2.style.display = 'none'
    const data = await response.json();
    console.log("Success:", data);
    updateDropdown(data);
    updateMap(data);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log(formData);
});

function updateMap(data) {
  drawnItems.clearLayers();
  for (let i = 0; i < data.length; i++) {
    let polygon = L.polygon(data[i].polygon, {
      color: "#00218b",
      fillColor: "#00218b",
      fillOpacity: 0.5,
    })
      .bindPopup(`<h3> ${data[i].title} </h3>`)
      .on("click", () => {
        map.fitBounds(polygon.getBounds());
      });
    let center = polygon.getBounds().getCenter();
    let countMarker = L.marker(center, {
      icon: L.divIcon({
        className: "count-marker",
        html: `<div class='count' id='count-${i}'><div class='number'>${data[i].count}</div></div>`,
        iconSize: [30, 30],
      }),
    }).addTo(map);
    drawnItems.addLayer(polygon);
    countMarker.on("add", function () {
      updateCountMarkerFontSize(
        this.getElement().querySelector(".count"),
        map.getZoom()
      );
    });
  }
}

let ourData2;

function updateDropdown(data) {
  ourData2 = data;
  let select = document.querySelector(".select-dropdown");
  select.innerHTML = "";
  for (let i = 0; i < data.length; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.text = data[i].title;
    select.appendChild(option);
  }

  // let allOption = document.createElement("option");
  // allOption.value = "-1";
  // allOption.text = "Все";
  // select.prepend(allOption);
  // select.value = "-1";
}

function updateCountMarkerFontSize(countMarkerElement, zoomLevel) {
  let fontSize = Math.max(12, 16 * (1 + (zoomLevel - 10) * 0.1));
  countMarkerElement.style.fontSize = `${fontSize}px`;
}

document.querySelector(".map-zoom-out-btn").addEventListener("click", () => {
  map.flyTo([55.753995, 37.614069], 10);
});
document.querySelector(".search-btn").addEventListener("click", () => {
  let select = document.querySelector(".select-dropdown");
  let value = select.options[select.selectedIndex].value;

  if (value !== "-1") {
    if (ourData2[value] && ourData2[value].polygon) {
      let polygon = L.polygon(ourData2[value].polygon);
      map.fitBounds(polygon.getBounds());
    } else {
      console.error("No polygon data found for the selected value:", value);
    }
  }
});

const fileInput = document.getElementById("file");
const fileLabel = document.getElementById("label");
const chartContainer = document.getElementById("chart-container");
fileInput.addEventListener("change", () => {
  const fileName = fileInput.value.split("\\").pop();
  fileLabel.textContent = fileName;
});
const reset = document.getElementById("reset");
reset.addEventListener("click", () => {
  fileLabel.textContent = "Нажмите, чтобы выбрать файл";
  fileInput.value = "";
});
const sendButton = document.getElementById("upload");

sendButton.onclick = async function () {
  loader1.style.display = 'block'
  const data = new FormData();
  data.append("file", fileInput.files[0]);
  try {
    const response = await fetch(
      "https://crack-locally-skink.ngrok-free.app/audience_reach",
      {
        method: "POST",
        body: data,
      }
    );

    if (response.ok) {
      fileLabel.textContent = "Нажмите, чтобы выбрать файл";
      loader1.style.display = 'none'
     
      const data = await response.json();
      console.log("Server response:", data);
      metr.style.display = 'flex'
      metr.textContent = data.value+'%'
      let labels = data.reach.map((item) => `${item.age_from}-${item.age_to}`);
      let values = data.reach.map((item) => item.percentage);
      chartContainer.style.display = "inline-flex";
      let radarCtx = document.getElementById("radarChart").getContext("2d");
      new Chart(radarCtx, {
        type: "radar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Audience Reach",
              data: values,
              fill: true,
              backgroundColor: "#4cf5f2",
              borderColor: "#4b6cb7",
              pointBackgroundColor: "#4cf5f2",
              pointBorderColor: "white",
              pointHoverBackgroundColor: "white",
              pointHoverBorderColor: "white",
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: "Audience Reach",
              color: "white",
            },
            legend: {
              labels: {
                color: "white",
              },
            },
          },
          scales: {
            r: {
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 20,
                color: "white",
              },
              angleLines: {
                display: true,
                color: "white",
              },
              grid: {
                color: "white",
              },
              gridLines: {
                color: "white",
              },
            },
          },
        },
      });

      // Bar chart
      let barCtx = document.getElementById("barChart").getContext("2d");
      new Chart(barCtx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Audience Reach",
              data: values,
              backgroundColor: "#4cf5f2",
              borderColor: "rgb(54, 162, 235)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: "Audience Reach",
              color: "white",
            },
            legend: {
              labels: {
                color: "white",
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: "white",
              },
              ticks: {
                color: "white",
              },
            },
            x: {
              grid: {
                color: "white",
              },
              ticks: {
                color: "white",
              },
            },
          },
        },
      });
    } else {
      throw new Error(
        `Server responded with ${response.status} (${response.statusText})`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
  }
};
