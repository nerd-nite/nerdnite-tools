#!/usr/bin/env perl

use strict;
use warnings;
use NerdNite::Email;
use Carp;
use Readonly;
use Data::Dumper;

my $email = NerdNite::Email->new();

my $command = shift || 'listpops';

my $pops = $email->request($command);
print Dumper($pops);