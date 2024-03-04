import {Stack} from "./Stack";

/**
 *
 * Related problems:
 *
 * Valid Parentheses: https://leetcode.com/problems/valid-parentheses/
 * Merge Intervals: https://leetcode.com/problems/merge-intervals/
 */

export class XMLParser {

    /**
     * Parses the given XML string.
     *
     * Returns nested interleaved text segments / XML nodes.
     *
     * @param str
     */
    public parse(str: string): BaseNode[] {
        const interval = this.getIntervals(str);
        const nestedIntervals = this.buildNestedIntervals(interval);

        if (nestedIntervals.length === 0) {
            return [];
        }

        const nodes: BaseNode[] = [];
        let current = nestedIntervals[0].interval[0];

        for (const nestedInterval of nestedIntervals) {
            const [nestedIntervalStart, nestedIntervalEnd] = nestedInterval.interval;

            if (nestedIntervalStart > current) {
                nodes.push(new TextNode(str.substring(current, nestedIntervalStart)));
            }

            nodes.push(this.getNodeForInterval(nestedInterval, str));

            current = nestedIntervalEnd + 1;
        }

        return nodes;
    }

    /**
     * Get starting and ending indices of all matching XML tags.
     * Uses stack based implementation.
     *
     * @param str
     */
    public getIntervals(str: string): [number, number][] {
        const stk = new Stack<TagInfo>();
        const intervals: [number, number][] = [];

        const addInterval = (i: number) => {
            if (stk.isEmpty()) {
                throw new Error(`Invalid XML, no matching tag for the closing tag at index ${i}`);
            }

            /**
             * Go backward until encountering the start of the tag.
             */
            let startOfTag = i;
            while (startOfTag > 0) {
                if (str[startOfTag] === "<") {
                    break;
                }

                startOfTag--;
            }

            /**
             * Extract the ending tag name.
             */
            const endingTagName = this.getTagNameStartingAt(str, startOfTag);

            /**
             * Pop the starting tag.
             */
            const startingTag = stk.pop();

            /**
             * If starting and ending tag names doesn't match, then the XML contains error.
             */
            if (startingTag.tagName !== endingTagName) {
                throw new Error(`Unmatched tag names, starting tag name is ${startingTag.tagName}, ending tag name is ${endingTagName}`);
            }

            /**
             * Add the interval in the result.
             */
            intervals.push([startingTag.startingIdx, i]);
        };



        let startedClosingTag = false;

        for (let i = 0; i < str.length; i++) {
            if (str[i] == "<") {
                if (i < str.length - 1 && str[i + 1] !== "/") {
                    const tagName = this.getTagNameStartingAt(str, i);
                    stk.push(new TagInfo(i, tagName));
                } else if (i < str.length - 1 && str[i + 1] === "/") {
                    startedClosingTag = true;
                }
            } else if (str[i] == ">") {
                if (startedClosingTag) {
                    addInterval(i);
                    startedClosingTag = false;
                } else if (i > 0 && str[i - 1] == "/") {
                    addInterval(i);
                }
            }
        }

        if (!stk.isEmpty()) {
            throw new Error(`Invalid XML - unmatched opening tags at index ${stk.peek()}.`);
        }

        return intervals;
    }

    /**
     * Merge the intervals as nested (embedded) intervals.
     *
     * e.g.,
     * input: [[0, 10], [3, 5], [6, 9], [11, 17], [13, 16], [18, 25]]
     * output:
     * [
     *  {
     *   "interval": [0, 10],
     *   "nestedIntervals": [
     *    {
     *     "interval" [3, 5],
     *     "nestedIntervals": []
     *    },
     *    {
     *     "interval": [6, 9],
     *     "nestedIntervals": []
     *    }
     *   ]
     *  },
     *  {
     *   "interval": [11, 17],
     *   "nestedIntervals": [
     *    {
     *     "interval": [13, 16],
     *     "nestedIntervals": []
     *    }
     *   ]
     *  },
     *  {
     *   "interval": [18, 25],
     *   "nestedIntervals": []
     *  }
     * ]
     *
     * @param intervals
     */
    public buildNestedIntervals(intervals: [number, number][]): NestedInterval[] {
        if (intervals.length === 0) {
            return [];
        }

        const sortedIntervals = intervals.sort(
            (a, b) => a[0] - b[0]
        );

        const merged: NestedInterval[] = [];
        for (let i = 0; i < sortedIntervals.length; i++) {
            const last = merged[merged.length - 1];

            if (last && last.interval[1] >= sortedIntervals[i][0]) {
                last.addNestedInterval(sortedIntervals[i]);
                continue;
            }

            merged.push(new NestedInterval(sortedIntervals[i]));
        }

        return merged;
    }

    /**
     * Build nested XML nodes for a given XML "nested interval" object and the XML string.
     * Creates interleaved text segments and XML nodes.
     *
     * @param interval
     * @param str
     */
    public getNodeForInterval(interval: NestedInterval, str: string): XMLNode {
        const nodes: BaseNode[] = [];
        const xmlNode = this.createXMLNode(str, interval);

        const [contentStart, contentEnd] = this.getContentStartEnd(interval, str);

        let current = contentStart;

        for (const nestedInterval of interval.nestedIntervals) {
            const [nestedIntervalStart, nestedIntervalEnd] = nestedInterval.interval;

            if (nestedIntervalStart > current) {
                nodes.push(new TextNode(str.substring(current, nestedIntervalStart)));
            }

            nodes.push(this.getNodeForInterval(nestedInterval, str));

            current = nestedIntervalEnd + 1;
        }

        if (contentEnd > current) {
            nodes.push(new TextNode(str.substring(current, contentEnd + 1)));
        }

        xmlNode.children.push(...nodes);
        return xmlNode;
    }

    /**
     * Create XML node given the full XML string and the index bounds.
     * Extracts tag name, attributes and the text content.
     *
     * @param str
     * @param interval
     */
    public createXMLNode(str: string, interval: NestedInterval): XMLNode {
        const [intervalStart, intervalEnd] = interval.interval;
        const tagText = str.substring(intervalStart, intervalEnd + 1);

        /**
         * Extract the tag name.
         */
        const tagName = this.getTagNameStartingAt(str, intervalStart);
        const openingTag = tagText.substring(tagText.indexOf("<"), tagText.indexOf(">") + 1);

        /**
         * Regex to find the attribute keys and values.
         * Used regex groups to easily take out the values.
         */
        const attrRegex = /(\s)(.+)(=)(")(.+)(")(\/)?>/g;
        const matches = openingTag.matchAll(attrRegex);
        const attrs: { [key: string]: string } = {};
        for (const match of matches) {
            attrs[match[2]] = match[5];
        }

        let textContent: string | undefined = undefined;
        if (interval.nestedIntervals.length == 0) {
            /**
             * Regex to find the text value of the tag.
             * Used regex groups to easily take out the values.
             */
            const textRegex = />(.*)</g;
            const textMatch = tagText.match(textRegex);
            if (textMatch) {
                textContent = textMatch[0].substring(1, textMatch[0].length - 1);
            }
        }

        const xmlNode = new XMLNode(tagName, attrs);
        if (textContent) {
            xmlNode.children.push(new TextNode(textContent));
        }

        return xmlNode;
    }

    /**
     * Gets the content start and end index given an XML element.
     *
     * @param interval
     * @param str
     */
    public getContentStartEnd(interval: NestedInterval, str: string): [number, number] {
        const [intervalStart, intervalEnd] = interval.interval;
        let contentStart = intervalStart;
        let contentEnd = intervalEnd;

        while (contentStart < str.length && str[contentStart] !== ">") {
            contentStart++;
        }

        while (contentStart >= 0 && str[contentEnd] !== "<") {
            contentEnd--;
        }

        return [contentStart + 1, contentStart - 1];
    }

    /**
     * Gets the tag name starting from the index of a "<".
     *
     * @param str
     * @param idx
     */
    public getTagNameStartingAt(str: string, idx: number): string {
        let startIdx = idx;

        /**
         * Move forward until starting the alphanumeric "tag name".
         */
        while (startIdx < str.length) {
            if (str[startIdx] !== "<" && str[startIdx] !== "\/") {
                break;
            }

            startIdx += 1;
        }

        let currentIdx = startIdx;

        /**
         * Regex for space OR line break OR > OR />
         */
        const regex = /^(\s|\/>|>)/;

        /**
         * Move ahead until a space or line break or ">" or "/>" is encountered.
         */
        while (currentIdx < str.length) {
            /**
             * Get one and two characters from the current index.
             */
            const oneChar = str[currentIdx];
            const twoChar = currentIdx < str.length - 1
                ? str.substring(currentIdx, currentIdx + 2)
                : str[currentIdx];

            /**
             * Match one character with "\s" or ">" and two characters with "/>".
             */
            if (regex.test(oneChar) || regex.test(twoChar)) {
                break;
            }

            currentIdx++;
        }

        /**
         * Extract the tag name and return.
         */
        return str.substring(startIdx, currentIdx);
    }
}

class TagInfo {
    constructor(public startingIdx: number, public tagName: string) {}
}

/**
 * Nested interval data structure
 */
class NestedInterval {

    public nestedIntervals: NestedInterval[] = [];

    constructor(public interval: [number, number]) {}

    /**
     *
     * Merge the given interval with current / potentially other nested intervals.
     *
     * @param interval
     */
    public addNestedInterval(interval: [number, number]) {
        for (const nestedInterval of this.nestedIntervals) {
            if (nestedInterval.interval[1] >= interval[0]) {
                nestedInterval.addNestedInterval(interval);
                return;
            }
        }

        this.nestedIntervals.push(new NestedInterval(interval));
    }
}

/**
 * Base node data structure.
 */
export class BaseNode {}

/**
 * Text node data structure.
 */
export class TextNode extends BaseNode {
    constructor(public value: string) {
        super();
    }
}

/**
 * XML node data structure.
 */
export class XMLNode extends BaseNode {

    public children: BaseNode[] = [];

    constructor(public name: string, public attrs: { [key: string]: string }) {
        super();
    }
}
