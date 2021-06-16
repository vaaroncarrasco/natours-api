class APIFeatures { // * Note: Remember this kw refers to class's instance object
    // mongooseQuery, routeQueryString
    constructor(query, queryString) { // query is mongoose's query looking for specific data according to routes queryString
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // * BUILD QUERY
        // Creating hard copy, not only reference - to manipulate {}
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1B) Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr)); // save into property

        // return whole instance object to gain access to methods and chain them
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(this.queryString.sort); //  sort('price ratingsAverage')
        } else {
            this.query = this.query.sort('-createdAt');
        }

        // return whole instance object to gain access to methods and chain them
        return this;
    }

    limitFields() {
         if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields); // .select('name duration price) // PROJECTING - selecting only certain fields
        } else {
            this.query = this.query.select('-__v'); // exclude __v field
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        // page=3&limit=10 -> skip(20) 21-30 is page 3
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;