export default async function handler(req, res) {

    if (req.method === "POST") {

        const dados = req.body;

        return res.status(200).json({
            mensagem: "Recebi os dados",
            dados
        });
    }

    res.status(200).json({
        status: "Backend funcionando"
    });
}
