// TEMPORARY — answers PRD open question 1: does CloudFront-Viewer-Country
// reach the Amplify compute runtime? Hit /api/geo-probe on the deployed
// site; if country is null, the header is not forwarded and the countries
// card on /enni will simply stay empty. Delete this route after checking.
export const GET = (req : Request) =>
    Response.json({
        country : req.headers.get("cloudfront-viewer-country"),
    });
