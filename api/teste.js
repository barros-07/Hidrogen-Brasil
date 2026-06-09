export default function handler(req, res) {
    res.status(200).json({
        checkout: "https://google.com"
    });
    console.log("Teste recebido:", req.body);
}
