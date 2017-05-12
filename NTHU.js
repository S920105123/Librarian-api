import axios from 'axios';
import uuid from 'uuid/v4';

// Develop server URL
const BaseUrl = 'http://localhost:8080/api/NTHU';

// Staging server URL
// const BaseUrl = 'http://weathermood-staging.us-west-2.elasticbeanstalk.com/api/NTHU';

export function getBookNTHU(searchText, type) {
    // For test
    //type=0;
    //searchText='123';

    if (!searchText || !searchText.trim()) {
        console.error("Error getting book - searchText cannot be empty.");
        return;
    }
    let url = `${BaseUrl}`;
    if (type==="isbn")
        url+="/ISBN?searchText=";
    else
        url+="/book?searchText=";
    url+=encodeURIComponent(searchText);

    console.log(`Making GET request to: ${url}`);

    return axios.get(url).then(function(res) {
        if (res.status !== 200)
            throw new Error(`Unexpected response code: ${res.status}`);

        const titleFlag = "var title = "
        const authorFlag = "<td   width=\"15%\" valign=top>";
        const locationFlag = "sub_library=";

        let data = res.data.html, result=[];

        let i=0;
        let idx = data.indexOf(titleFlag);
        while (idx!==-1) {
            result[i] = {};

            /* Get title */
            let subStr = '', j;
            data = data.slice(idx+titleFlag.length+1); // Bad efficiency...
            for (j=0; j<data.length; j++) {
                // Filter special char.
                let c = data.charAt(j);
                if (c==='&') {
                    j+=5;
                    subStr+=' ';
                    continue;
                } else if (c==='\'') {
                    break;
                }
                subStr+=c;
            }
            if (subStr[subStr.length-1]==="/")
                subStr = subStr.slice(0,subStr.length-2); // Skip the trailing '/'
            result[i]['bookName'] = subStr;
            //console.log("BookName =",subStr);

            /* Get author */
            subStr=''
            j = data.indexOf(authorFlag)+authorFlag.length;
            for (; j<data.length; j++) {
                // Filter special char.
                let c = data.charAt(j);
                if (c==='<') {
                    break;
                }
                subStr+=c;
            }
            if (subStr[0]==='/')
                subStr = subStr.slice(1);
            result[i]['author'] = subStr;
            //console.log("Author =",subStr);

            /* Get location */
            subStr='';
            j = data.indexOf(locationFlag)+locationFlag.length;
            for (; j<data.length && data.charAt(j)!=='>'; j++);
            j++;
            while (data.charAt(j)!=='<') {
                subStr+=data.charAt(j);
                j++;
            }

            let temp = subStr.indexOf("(");
            if (temp!=-1) {
                result[i]['status'] = ["館藏/借出: " + subStr.slice(temp)];
                subStr = subStr.slice(0,temp);
            }
            result[i]['location'] = ["清華大學圖書館 - "+subStr];
            //console.log("Location =",subStr);

            idx = data.indexOf(titleFlag);
            j = data.indexOf(locationFlag,j)+locationFlag.length;
            if (j!==-1 && idx!==-1 && j<idx) {
                /* Special case: Two location */
                subStr='';
                for (; j<data.length && data.charAt(j)!=='>'; j++);
                j++;
                while (data.charAt(j)!=='<') {
                    subStr+=data.charAt(j);
                    j++;
                }

                temp = subStr.indexOf("(");
                if (temp!=-1) {
                    result[i]['status'].push("館藏/借出: " + subStr.slice(temp));
                    subStr = subStr.slice(0,temp-1);
                }
                result[i]['location'].push("清華大學圖書館 - "+subStr);
                //console.log("Location =",subStr);
            }

            result[i]['id'] = uuid();
            i++;
        }

        let temp = {
            data: result
        };
        console.log("NTHU result:");
        console.log(temp);

        return temp;
    });
}
