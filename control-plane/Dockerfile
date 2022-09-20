# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM mcr.microsoft.com/azure-cli:2.36.0 as release

ENV SETUP_SCRIPT https://gist.githubusercontent.com/danielscholl/12e7107115b01ecc756a38226a6ce9df/raw/c3053de26f33ff247245836eb3707e7ffcad0731/hello.sh
ADD containerRun.sh /root/

CMD ["/bin/bash", "/root/containerRun.sh"]
