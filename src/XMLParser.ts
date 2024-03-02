import {Stack} from "./Stack";

class NestedInterval {

    public nestedIntervals: NestedInterval[] = [];

    constructor(public interval: [number, number]) {}

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

class BaseNode {}

class TextNode extends BaseNode {
    constructor(public value: string) {
        super();
    }
}

class XMLNode extends BaseNode {

    public children: BaseNode[] = [];

    constructor(public name: string, public attrs: { [key: string]: string }) {
        super();
    }
}

export class XMLParser {

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

    public getIntervals(str: string): [number, number][] {
        const stk = new Stack<number>();
        const intervals: [number, number][] = [];

        const addInterval = (i: number) => {
            if (stk.isEmpty()) {
                throw new Error("Invalid XML " + i);
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
            throw new Error("Invalid SSML - non empty stack");
        }

        return intervals;
    }

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
