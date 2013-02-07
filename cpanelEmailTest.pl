#!/usr/bin/env perl

use strict;
use warnings;
use CpanelEmail;
use Carp;
use Readonly;
use Data::Dumper;

my $email = CpanelEmail->new(1);

my $pops = $email->request('listpops');
print Dumper($pops);