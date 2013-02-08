#!/usr/bin/env perl

use strict;
use warnings;
use CpanelEmail;
use Carp;
use Readonly;
use Data::Dumper;

my $email = CpanelEmail->new();

my $command = shift || 'listpops';

my $pops = $email->request($command);
print Dumper($pops);