export default async function handler(req, res) {

    const { produto } = req.body;

    console.log("Produto recebido:", produto);

    res.status(200).json({
        checkout: "https://google.com"
    });
}
