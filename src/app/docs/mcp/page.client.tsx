"use client";

// REACT CORE ==========================================================================================================
import React from "react";

// UI ==================================================================================================================
import {
    Article, Callout, CodeBlock, Div, Divider, Header, Heading4, Heading5, Heading6, Table, Text,
} from "fictoan-react";

const CLAUDE_CODE_SNIPPET = `claude mcp add dbie -- npx -y @reserve-bank-innovation-hub/dbie-mcp`;

const CLIENT_CONFIG_SNIPPET = `{
    "mcpServers" : {
        "dbie" : {
            "command" : "npx",
            "args"    : [ "-y", "@reserve-bank-innovation-hub/dbie-mcp" ]
        }
    }
}`;

const BASE_URL_SNIPPET = `{
    "command" : "npx",
    "args"    : [ "-y", "@reserve-bank-innovation-hub/dbie-mcp" ],
    "env"     : { "DBIE_BASE_URL" : "https://dev.dbie.rbihub.in" }
}`;

const McpDocsPage = () => {
    return (
        <Article id="docs-mcp-page" className="docs-page">
            <Header id="title-card" bgColour="white" padding="micro">
                <Div>
                    <Heading4 weight="700" marginBottom="nano">
                        AI access via MCP
                    </Heading4>

                    <Heading6 weight="400" opacity="60">
                        Connect Claude — or any MCP client — to every table and series on this site.
                    </Heading6>
                </Div>
            </Header>

            <Div className="docs-content grid-cell" padding="micro">
                <Div className="docs-prose">
                    <Text marginBottom="micro">
                        <code>@reserve-bank-innovation-hub/dbie-mcp</code> is an{" "}
                        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                            MCP
                        </a>{" "}
                        server that lets AI assistants search, browse and fetch RBI economic data from this
                        site. It is a thin, read-only layer over the same static JSON the pages render — no
                        credentials, no writes, nothing to host.
                    </Text>

                    <Heading5 weight="700" marginBottom="nano">
                        Set it up
                    </Heading5>

                    <Text marginBottom="nano">
                        With Claude Code, one command:
                    </Text>

                    <CodeBlock
                        source={CLAUDE_CODE_SNIPPET}
                        language="bash"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="nano">
                        For any other MCP client (Claude Desktop, Cursor, VS Code, …), add this to its MCP
                        configuration:
                    </Text>

                    <CodeBlock
                        source={CLIENT_CONFIG_SNIPPET}
                        language="json"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Text marginBottom="micro">
                        Node 20 or newer is the only requirement — <code>npx</code> fetches and runs the
                        package on demand.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        What the assistant can do
                    </Heading5>

                    <Table bordersFor="rows" isFullWidth marginBottom="micro">
                        <thead>
                            <tr>
                                <th>Tool</th>
                                <th>What it does</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>search_tables</code></td>
                                <td>Full-text search across every table and series, typo-tolerant</td>
                            </tr>
                            <tr>
                                <td><code>list_tables</code></td>
                                <td>Browse the catalogue — sections, then the tables in each</td>
                            </tr>
                            <tr>
                                <td><code>get_series</code></td>
                                <td>Observations for a series, sliced by date range and columns, with units</td>
                            </tr>
                            <tr>
                                <td><code>get_table</code></td>
                                <td>Any table&rsquo;s full JSON payload, long arrays truncated to protect context</td>
                            </tr>
                        </tbody>
                    </Table>

                    <Text marginBottom="micro">
                        A typical exchange: ask &ldquo;how have India&rsquo;s forex reserves moved over the
                        last five years?&rdquo; — the assistant calls <code>search_tables</code>, picks the
                        weekly reserves series, then pulls exactly that window with <code>get_series</code>.
                    </Text>

                    <Divider kind="secondary" marginBottom="micro" />

                    <Heading5 weight="700" marginBottom="nano">
                        Pointing at another deployment
                    </Heading5>

                    <Text marginBottom="nano">
                        Data comes from <code>DBIE_BASE_URL</code>, defaulting to{" "}
                        <code>https://dbie.rbihub.in</code>. To read from a different environment:
                    </Text>

                    <CodeBlock
                        source={BASE_URL_SNIPPET}
                        language="json"
                        withSyntaxHighlighting
                        showCopyButton
                        marginBottom="micro"
                    />

                    <Callout kind="info">
                        <Text>
                            <strong>Data vintage</strong> — responses reflect the deployment&rsquo;s last
                            scrape of the DBIE portal, not live data. Every response carries its source URL,
                            and series responses carry <code>as_of</code> — the latest observation period — so
                            assistants can (and should) disclose how current the numbers are.
                        </Text>
                    </Callout>
                </Div>
            </Div>
        </Article>
    );
};

export default McpDocsPage;
