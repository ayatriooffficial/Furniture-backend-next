const categoryDescriptionDB = require('../../model/CategoryDescription')

exports.create_categoryDescription = async (req, res) => {
    try {
        const imageUrl = req.files
            .filter((file) => file.fieldname === 'image')
            .map((file) => file.location);

        // console.log('images', imageUrl);

        const { imgTitle, review, occupation, category, reviewTitle, linkedln, ...circles } = req.body;

        const convertToSchemaType = (inputData) => {
            const result = { circles: [] };

            for (const key in inputData) {
                if (inputData.hasOwnProperty(key)) {
                    const match = key.match(/^circles\[(\d+)\]\.(\w+)$/);
                    if (match) {
                        const index = parseInt(match[1]);
                        const field = match[2];

                        if (!result.circles[index]) {
                            result.circles[index] = {};
                        }

                        result.circles[index][field] = field === 'productPrice' ? Number(inputData[key]) : inputData[key];
                    }
                }
            }

            return result;
        };
        const formattedCircles = convertToSchemaType(circles);

        const personReview = [
            {
                title:reviewTitle,
                profileImg:imageUrl[1],
                review,
                occupation,
                linkedln

            }
        ]

        const categoryDescription_instance = new categoryDescriptionDB({
            imgSrc: imageUrl[0],
            imgTitle: imgTitle,
            circles: formattedCircles,
            category,
            personReview
        });

        await categoryDescription_instance.save();
        res.status(201).json({ message: "Category description created successfully!..." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getCategoryDescription = async (req, res) => {
    const { query } = req.query;
    try {
        let categoryDescription;
        if(query){
            categoryDescription = await categoryDescriptionDB.find({ category: query });
        }else{
            categoryDescription = await categoryDescriptionDB.find();
        }
        res.status(200).json(categoryDescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deleteCategoryDescription = async (req, res) => {
    const id = req.params.id;

    try {
        const result = await categoryDescriptionDB.findOneAndDelete({ _id: id });

        if (!result) {
            return res.status(404).json({ message: 'category Description not found' });
        }

        // Fetch updated data after deletion
        const updatedData = await categoryDescriptionDB.find();

        res.json(updatedData);
    } catch (error) {
        console.error('Error deleting circle:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};