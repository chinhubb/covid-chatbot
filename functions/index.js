const admin = require("firebase-admin");
admin.initializeApp();
const functions = require("firebase-functions");
const axios = require("axios");
const cheerio = require("cheerio");

exports.covid19 = functions.pubsub
  .schedule("30 * * * *")
  .timeZone("Asia/Bangkok")
  .onRun(async (context) => {
    const response = await axios.get("https://covid19.ddc.moph.go.th/th");
    const html = response.data;
    const $ = cheerio.load(html);

    const selector = $(".block-st-all h1");

    if (selector.length !== 4) {
      return null;
    }
    let current = "";
    selector.each((index, element) => {
      if (index === 0) {
        current = $(element).text();
      } else {
        current = current.concat("|", $(element).text());
      }
    });
    let last = await admin.firestore().doc("line/covid19").get();
    if (!last.exists || last.data().report !== current) {
      await admin.firestore().doc("line/covid19").set({ report: current });
      broadcast(current);
    }
  });
const broadcast = (current) => {
  const currents = current.split("|");
  return axios({
    method: "post",
    url: "https://api.line.me/v2/bot/message/broadcast",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer xxxx",
    },
    data: JSON.stringify({
      messages: [
        {
          type: "flex",
          altText: "รายงานสถานการณ์ โควิด-19",
          contents: {
            type: "bubble",
            size: "giga",
            direction: "ltr",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#d6007d",
              contents: [
                {
                  type: "text",
                  text: "ติดเชื้อสะสม",
                  color: "#ffffff",
                  align: "center",
                },
                {
                  type: "text",
                  text: currents[0],
                  weight: "bold",
                  size: "4xl",
                  color: "#ffffff",
                  align: "center",
                },
              ],
            },
            body: {
              type: "box",
              layout: "horizontal",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  paddingAll: "2%",
                  backgroundColor: "#046034",
                  cornerRadius: "8px",
                  contents: [
                    {
                      type: "text",
                      text: "หายแล้ว",
                      color: "#ffffff",
                      align: "center",
                    },
                    {
                      type: "text",
                      text: currents[1],
                      weight: "bold",
                      size: "xl",
                      color: "#ffffff",
                      align: "center",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  paddingAll: "2%",
                  backgroundColor: "#179C9B",
                  cornerRadius: "8px",
                  contents: [
                    {
                      type: "text",
                      text: "รักษาตัวอยู่ใน รพ.",
                      color: "#ffffff",
                      align: "center",
                    },
                    {
                      type: "text",
                      text: currents[2],
                      weight: "bold",
                      size: "xl",
                      color: "#ffffff",
                      align: "center",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  paddingAll: "2%",
                  backgroundColor: "#666666",
                  cornerRadius: "8px",
                  contents: [
                    {
                      type: "text",
                      text: "เสียชีวิต",
                      color: "#ffffff",
                      align: "center",
                    },
                    {
                      type: "text",
                      text: currents[3],
                      weight: "bold",
                      size: "xl",
                      color: "#ffffff",
                      align: "center",
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),
  });
};

