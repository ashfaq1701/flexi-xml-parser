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
        const stk = new Stack<number>();
        const intervals: [number, number][] = [];

        const addInterval = (i: number) => {
            if (stk.isEmpty()) {
                throw new Error(`Invalid XML, no matching tag for the closing tag at index ${i}`);
            }

            intervals.push([stk.pop(), i]);
        };

        let startedClosingTag = false;

        for (let i = 0; i < str.length; i++) {
            if (str[i] == "<") {
                if (i < str.length - 1 && str[i + 1] !== "/") {
                    stk.push(i);
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
        const nodes = [];
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

        let current = 1;
        while (tagText[current] != " " && tagText[current] != ">" && tagText[current] != "\n" && tagText[current] != "\r") {
            current++;
        }
        const tagName = tagText.substring(1, current);

        const openingTagEndIdx = tagText.substring(tagText.indexOf("<"), tagText.indexOf(">") + 1);
        const attrRegex = /(\s)(.+)(=)(")(.+)(")(\/)?>/g;
        const matches = openingTagEndIdx.matchAll(attrRegex);
        const attrs: { [key: string]: string } = {};
        for (const match of matches) {
            attrs[match[2]] = match[5];
        }

        let textContent: string | undefined = undefined;
        if (interval.nestedIntervals.length == 0) {
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
class BaseNode {}

/**
 * Text node data structure.
 */
class TextNode extends BaseNode {
    constructor(public value: string) {
        super();
    }
}

/**
 * XML node data structure.
 */
class XMLNode extends BaseNode {

    public children: BaseNode[] = [];

    constructor(public name: string, public attrs: { [key: string]: string }) {
        super();
    }
}
